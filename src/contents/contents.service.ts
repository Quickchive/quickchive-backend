import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

import {
  AddContentBodyDto,
  AddContentOutput,
  AddMultipleContentsBodyDto,
  DeleteContentOutput,
  SummarizeContentBodyDto,
  SummarizeContentOutput,
  toggleFavoriteOutput,
  UpdateContentBodyDto,
} from './dtos/content.dto';
import {
  LoadFavoritesOutput,
  LoadPersonalContentsOutput,
} from './dtos/load-personal-contents.dto';
import { SummaryService } from '../summary/summary.service';
import { User } from '../domain/user/entities/user.entity';
import { Category } from '../categories/category.entity';
import { Content } from './entities/content.entity';
import { LoadReminderCountOutput } from './dtos/load-personal-remider-count.dto';
import { UserRepository } from '../domain/user/user.repository';
import { ContentRepository } from './repository/content.repository';
import { CategoryRepository } from '../categories/category.repository';
import { GetLinkInfoResponseDto } from './dtos/get-link.response.dto';
import { checkContentDuplicateAndAddCategorySaveLog } from '../categories/utils/category.util';
import { Transactional } from '../common/aop/transactional';
import { getLinkInfo } from './util/content.util';

@Injectable()
export class ContentsService {
  constructor(
    @Inject(UserRepository) private readonly userRepository: UserRepository,
    private readonly contentRepository: ContentRepository,
    private readonly summaryService: SummaryService,
    private readonly categoryRepository: CategoryRepository,
    private readonly dataSource: DataSource,
  ) {}

  @Transactional()
  async addContent(
    user: User,
    {
      link,
      title,
      comment,
      reminder,
      favorite,
      parentId,
      categoryId,
    }: AddContentBodyDto,
    entityManager?: EntityManager,
  ): Promise<AddContentOutput> {
    const userInDb = await this.userRepository.findOneWithContentsAndCategories(
      user.id,
    );
    if (!userInDb) {
      throw new NotFoundException('User not found');
    }

    categoryId = categoryId ? categoryId : parentId;

    const {
      title: linkTitle,
      siteName,
      description,
      coverImg,
    } = await getLinkInfo(link);
    title = title ? title : linkTitle;

    const content = new Content();

    if (categoryId) {
      const category = await this.categoryRepository.findById(
        categoryId,
        entityManager,
      );

      if (!category) throw new NotFoundException('Category not found');

      await checkContentDuplicateAndAddCategorySaveLog(
        link,
        category,
        userInDb,
      );

      content.category = category;
    }

    content.link = link;
    content.title = title;
    content.siteName = siteName;
    content.coverImg = coverImg;
    content.description = description;
    content.comment = comment;
    content.reminder = reminder;
    content.user = user;
    content.favorite = favorite;

    await this.contentRepository.createOne(content, entityManager);
    return {};
  }

  @Transactional()
  async addMultipleContents(
    user: User,
    { contentLinks, categoryName, parentId }: AddMultipleContentsBodyDto,
    entityManager?: EntityManager,
  ): Promise<AddContentOutput> {
    const userInDb = await this.userRepository.findOneWithContentsAndCategories(
      user.id,
    );

    if (!userInDb) {
      throw new NotFoundException('User not found');
    }

    if (contentLinks.length > 0) {
      let category: Category | undefined = undefined;
      if (categoryName) {
        category = await this.categoryRepository.getOrCreateCategory(
          categoryName,
          parentId,
          userInDb,
          entityManager,
        );
      }

      await Promise.all(
        contentLinks.map(async (link) => {
          const { title, description, coverImg, siteName } = await getLinkInfo(
            link,
          );

          if (category) {
            await checkContentDuplicateAndAddCategorySaveLog(
              link,
              category,
              userInDb,
            );
          }

          const content = new Content();
          content.link = link;
          content.title = title;
          content.siteName = siteName;
          content.coverImg = coverImg;
          content.category = category;
          content.description = description;
          content.user = userInDb;

          await this.contentRepository.createOne(content, entityManager);
        }),
      );
    }

    return {};
  }

  @Transactional()
  async updateContent(
    user: User,
    {
      id: contentId,
      link,
      title,
      description,
      comment,
      reminder,
      favorite,
      categoryName,
      parentId,
    }: UpdateContentBodyDto,
    entityManager?: EntityManager,
  ): Promise<AddContentOutput> {
    const newContentObj = {
      link,
      title,
      description,
      comment,
      reminder,
      favorite,
    };
    const userInDb = await this.userRepository.findOneWithContentsAndCategories(
      user.id,
    );
    if (!userInDb) {
      throw new NotFoundException('User not found');
    }

    const content = userInDb?.contents?.filter(
      (content) => content.id === contentId,
    )[0];
    if (!content) {
      throw new NotFoundException('Content not found.');
    }

    let category: Category | undefined = undefined;
    if (categoryName) {
      category = await this.categoryRepository.getOrCreateCategory(
        categoryName,
        parentId,
        userInDb,
        entityManager,
      );

      await checkContentDuplicateAndAddCategorySaveLog(
        link,
        category,
        userInDb,
      );
    }

    await this.contentRepository.updateOne(
      {
        id: content.id,
        ...newContentObj,
        category,
      },
      entityManager,
    );

    return {};
  }

  @Transactional()
  async toggleFavorite(
    user: User,
    contentId: number,
    entityManager?: EntityManager,
  ): Promise<toggleFavoriteOutput> {
    try {
      const userInDb = await this.userRepository.findByIdWithContents(user.id);

      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const content = userInDb?.contents?.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      content.favorite = !content.favorite;
      await this.contentRepository.createOne(content, entityManager);

      return {};
    } catch (e) {
      throw e;
    }
  }

  @Transactional()
  async deleteContent(
    user: User,
    contentId: number,
    entityManager?: EntityManager,
  ): Promise<DeleteContentOutput> {
    try {
      const content = await this.contentRepository.findOneBy({ id: contentId });

      if (!content) {
        throw new NotFoundException('Content not found.');
      }
      if (content.userId !== user.id) {
        throw new ForbiddenException(
          'You are not allowed to delete this content',
        );
      }

      // delete content
      await this.contentRepository.deleteOne(content.id, entityManager);

      return {};
    } catch (e) {
      throw e;
    }
  }

  async loadPersonalContents(
    user: User,
    categoryId: number | undefined,
  ): Promise<LoadPersonalContentsOutput> {
    try {
      let contents = await this.contentRepository.findWithCategories(user.id);

      if (categoryId && contents) {
        contents = contents.filter(
          (content) => content?.category?.id === categoryId,
        );
      }

      return {
        contents,
      };
    } catch (e) {
      throw e;
    }
  }

  async loadFavorites(user: User): Promise<LoadFavoritesOutput> {
    try {
      const favoriteContents =
        await this.contentRepository.findWhereFavoriteWithCategories(user.id);

      return {
        favorite_contents: favoriteContents,
      };
    } catch (e) {
      throw e;
    }
  }

  async loadReminderCount(user: User): Promise<LoadReminderCountOutput> {
    try {
      // get reminder not null
      const reminderCountThatIsNotNull =
        await this.contentRepository.GetCountWhereReminderIsNotNull(user.id);

      // get reminder is past
      const reminderCountThatIsPast =
        await this.contentRepository.GetCountWhereReminderIsPast(user.id);

      // minus reminderCountThatIsPast from reminderCount
      const reminderCount =
        reminderCountThatIsNotNull - reminderCountThatIsPast;

      return {
        count: reminderCount,
      };
    } catch (e) {
      throw e;
    }
  }

  async summarizeContent(
    user: User,
    contentId: number,
  ): Promise<SummarizeContentOutput> {
    try {
      const userInDb = await this.userRepository.findByIdWithContents(user.id);
      if (!userInDb) {
        throw new NotFoundException('User not found');
      }

      const content: Content | undefined = userInDb?.contents?.filter(
        (content) => content.id === contentId,
      )[0];

      if (!content) {
        throw new NotFoundException('Content not found.');
      }

      // 문서 요약을 위한 본문 크롤링
      const document: string = await this.summaryService.getDocument(
        content.link,
      );

      // 크롤링 후 처리
      let summary: string = '';
      if (!document) {
        throw new BadRequestException('Document not found.');
      } else if (document.length > 1900) {
        let sliceIndex: number = 0;
        for (let i = 0; i < Math.ceil(document.length / 1900); i++) {
          const slicedSummary = await this.summaryService.summaryContent({
            title: content?.title,
            content: document.slice(sliceIndex, sliceIndex + 1900),
          });
          summary += slicedSummary.summary;
          sliceIndex += 1900;
        }
      } else if (document.length <= 1900) {
        ({ summary } = await this.summaryService.summaryContent({
          title: content?.title,
          content: document,
        }));
      }

      return { summary };
    } catch (e) {
      throw e;
    }
  }

  async getLinkInfo(link: string) {
    const data = await getLinkInfo(link);

    return new GetLinkInfoResponseDto(data);
  }

  async testSummarizeContent({
    title,
    content: document,
  }: SummarizeContentBodyDto): Promise<SummarizeContentOutput> {
    try {
      let summary: string = '';

      if (document.length > 1900) {
        let sliceIndex: number = 0;
        for (let i = 0; i < Math.ceil(document.length / 1900); i++) {
          const slicedSummary = await this.summaryService.summaryContent({
            title,
            content: document.slice(sliceIndex, sliceIndex + 1900),
          });
          summary += slicedSummary.summary;
          sliceIndex += 1900;
        }
      } else if (document.length <= 1900) {
        ({ summary } = await this.summaryService.summaryContent({
          title,
          content: document,
        }));
      }

      return { summary };
    } catch (e) {
      throw e;
    }
  }

  async restoreContent(user: User, contentId: number) {
    try {
      const content = await this.contentRepository.findOne({
        where: {
          id: contentId,
        },
        withDeleted: true,
      });

      if (!content) {
        throw new NotFoundException('Content not found.');
      }
      if (content.userId !== user.id) {
        throw new ForbiddenException(
          'You are not allowed to restore this content',
        );
      }

      content.deletedAt = null;
      await this.contentRepository.save(content);

      return {};
    } catch (e) {
      throw e;
    }
  }
}
