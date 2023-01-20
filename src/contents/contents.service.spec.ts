import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CONFIG_OPTIONS } from '../common/common.constants';
import { SummaryService } from '../summary/summary.service';
import { User, UserRole } from '../users/entities/user.entity';
import { DataSource, Repository } from 'typeorm';
import { CategoryService, ContentsService } from './contents.service';
import { Content } from './entities/content.entity';
import { Category } from './entities/category.entity';
import {
  CategoryRepository,
  customCategoryRepositoryMethods,
} from './repository/category.repository';
import { RecentCategoryList } from './dtos/category.dto';

const mockRepository = () => ({
  // make as a function type that returns Object.
  // fake for Unit Test
  findOne: jest.fn(), // create Mock Func
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
});

const mockCategoryRepository = () => ({
  findOne: jest.fn(), // create Mock Func
  save: jest.fn(),
  create: jest.fn(),
  delete: jest.fn(),
  ...customCategoryRepositoryMethods,
});

type MockRepository<T = any> = Partial<Record<keyof Repository<T>, jest.Mock>>;

/** Typescript things
 *
 * type Partial<T> = { [P in keyof T]?: T [P]; }
 * Partial : Make all properties in T optional.
 *
 * type Record<K extends string | number | symbol, T> = { [P in K]: T; }
 * Record : Construct a type with a set of properties K of type T.
 *
 */

describe('ContentsService', () => {
  let service: ContentsService;
  let usersRepository: MockRepository<User>;
  let summarizeService: SummaryService;
  let categoryRepository: CategoryRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ContentsService,
        SummaryService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Content),
          useValue: mockRepository(),
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository(),
        },
        {
          provide: DataSource,
          useClass: class MockDataSource {},
        },
        {
          provide: CONFIG_OPTIONS,
          useValue: {
            apiClientId: process.env.NAVER_API_CLIENT_ID,
            apiClientSecret: process.env.NAVER_API_CLIENT_SECRET,
            clovaSummaryRequestUrl: process.env.NAVER_CLOVA_SUMMARY_REQUEST_URL,
          },
        },
      ],
    }).compile();

    service = module.get<ContentsService>(ContentsService);
    usersRepository = module.get(getRepositoryToken(User));
    summarizeService = module.get<SummaryService>(SummaryService);
    categoryRepository = module.get(getRepositoryToken(Category));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('summarizeContent', () => {
    const fakeUser: User = {
      id: 1,
      name: 'hou27',
      email: '',
      password: '',
      role: UserRole.Client,
      verified: false,
      hashPassword: jest.fn(),
      checkPassword: jest.fn(),
      createdAt: undefined,
      updatedAt: undefined,
    };
    const fakeContentId: number = 1;
    const fakeDocument: string =
      '콘텐츠 기반 필터링\n콘텐츠 기반 필터링은 아래 그림에 표현된 것과 같이, 사용자가 소비한 아이템에 대해 아이템의 내용(content)이 비슷하거나 특별한 관계가 있는 다른 아이템을 추천하는 방법을 말합니다. 아이템의 내용은 아이템을 표현할 수 있는 데이터를 지칭하는데, 아이템 카테고리, 아이템 이름과 같은 텍스트 데이터, 이미지 데이터가 주로 사용됩니다. 다른 사용자의 아이템 소비 이력을 활용하는 협업 필터링(Collaborative filtering) 과는 주로 사용하는 데이터가 다르다는 차이점이 있습니다.\n아이템이 유사한지 확인하려면 아이템의 비슷한 정도(유사도, similarity)를 수치로 계산할 수 있어야 합니다. 유사도 계산을 위해서 일반적으로 아이템을 벡터 형태로 표현하고 이들 벡터 간의 유사도 계산 방법을 많이 활용합니다.\n아이템을 잘 표현할 수 있는 벡터를 만드는 데 널리 사용되는 방법으로는 (1) 원 핫 인코딩(One-hot encoding), (2) 임베딩(Embedding)이 있습니다.\n원 핫 인코딩(One-hot encoding)은 아이템의 카테고리와 같은 범주형 데이터(categorical feature)를 표현하는 간단한 방법으로, 표현해야 하는 범주의 개수를 크기로 갖는 벡터를 만들어 데이터를 1과 0으로 표현하는 방법입니다. 아래 그림처럼 4가지의 아이템의 색상 데이터를 표현하고자 한다면, 그림 오른쪽처럼 특정 색상만 1의 값을 갖고 나머지는 0의 값을 갖는 벡터를 만들 수 있습니다.\n표현하는 범주형 데이터의 종류에 따라 0과 1 대신 다양한 실숫값을 사용하기도 합니다. 예를 들어, 텍스트 데이터의 경우는 등장하는 단어를 각각의 범주로 생각하고 각 단어의 중요도나 빈도를 반영하기 위해 TF-IDF 가중치(weight)를 계산해 1 대신 넣기도 합니다.\n카테고리와 같은 간단한 범주형 데이터의 경우 원 핫 인코딩(One-hot encoding)으로 표현이 가능하지만, 표현해야 하는 데이터 범주의 영역이 넓거나 이미지와 같이 복잡한 데이터인 경우는 데이터를 고정된 크기의 벡터로 표현하는 임베딩(Embedding) 방법을 많이 사용합니다. 벡터의 크기가 고정되어 있어 다루어야 하는 데이터의 크기가 늘어나더라도 상대적으로 적은 크기의 데이터를 통해 표현이 가능하고 딥러닝을 활용한 텍스트, 이미지 모델을 적용해 좋은 품질의 벡터를 얻을 수 있습니다.\n텍스트 데이터의 경우는 Word2Vec 모델이 제일 널리 알려지고 사용되는 텍스트 임베딩 모델입니다. Word2Vec으로 각 단어의 임베딩 벡터를 학습하고, 텍스트에 등장하는 단어의 벡터를 합하거나 TF-IDF 가중 합산을 하는 방식으로 많이 활용되고 있습니다. 이후에 텍스트에 등장하는 단어 사이의 순서를 고려하기 위한 CNN, RNN 모델들이 제안되었고, 최근에는 BERT와 같은 대규모 텍스트 모델을 임베딩 모델로 활용하기 위한 다양한 연구가 등장했습니다.\n이미지 데이터의 경우는 ImageNet 데이터의 카테고리 분류를 위해 미리 학습된 모델을 바탕으로 실제 사용할 데이터에 대해 파라미터 미세 조정(Fine-tuning)을 수행한 다음, 분류 레이어(classification layer)의 입력으로 들어가는 보틀넥 피처(Bottleneck feature)를 이미지 임베딩으로 사용하는 방법이 일반적입니다. 인물 사진이나 쇼핑과 같은 일부 도메인에서는 레이어 구조를 수정해 카테고리 분류 대신 유사, 동일성 여부를 직접 판별하는 샴 네트워크(Siamese network), 삼중항 네트워크(Triplet network)를 적용하는 방법도 있습니다.\n이렇게 표현된 아이템 벡터는 내적(Dot product), 코사인 유사도(Cosine similarity), 피어슨 상관 계수(Pearson correlation coefficient)와 같은 다양한 벡터 유사도 측정 방식을 통해 아이템 유사도를 측정하는 용도로 사용됩니다. 측정된 유사도를 바탕으로 사용자가 최근 소비한 아이템과 유사한 아이템을 추천하면 콘텐츠 기반 필터링을 통한 추천이 됩니다.\n콘텐츠 기반 필터링은 아이템 정보만 있으면 추천이 가능하기 때문에 소비 이력이 없는 새로운 아이템에 대한 추천이 바로 가능하다는 장점이 있습니다. 하지만 충분한 소비 이력이 쌓인 아이템에 대해서는 협업 필터링에 비해 추천 성능이 밀린다는 인식이 보편적입니다. 이런 이유로, 콘텐츠 기반 필터링은 추천 대상 아이템이 빠르게 바뀌는 상황이나 소비 이력이 적은 아이템에 대해, 협업 필터링을 보완하는 용도로 많이 활용됩니다.\n카카오웹툰에서의 콘텐츠 기반 필터링\n콘텐츠 기반 필터링을 통한 추천 로직은 카카오의 많은 서비스에 이미 적용이 되어 있습니다. 이번 단락에서는 카카오웹툰의 연관 작품 추천 영역에 적용된 콘텐츠 기반 필터링 로직을 소개하겠습니다.\n아래 화면은 카카오웹툰에서 작품을 열람하기 위해 작품 리스트에서 작품을 클릭하면 진입하게 되는 작품 홈 영역입니다. 작품 홈 영역 상단에는 해당 작품을 본 사용자가 볼 만한 다른 작품을 추천해 주는 연관 추천 영역(“A 작품과 비슷한 작품들” 영역)이 있습니다. 사용자는 좌우로 추천 리스트를 스와이프 해 다른 작품을 탐색하고 열람할 수 있습니다. 여기에 제공되는 추천에 콘텐츠 기반 필터링을 활용하고 있다';

    it('should success if document length over 1900', async () => {
      usersRepository.findOne.mockReturnValue({
        id: 1,
        contents: [
          {
            id: 1,
            link: 'https://brunch.co.kr/@icaryus/15',
          },
        ],
      });

      summarizeService.getDocument = jest.fn().mockReturnValue(fakeDocument);

      const summaryContentSpyFn = jest.spyOn(
        summarizeService,
        'summaryContent',
      );

      const result = await service.summarizeContent(fakeUser, fakeContentId);
      // console.log(result);

      expect(summarizeService.getDocument).toHaveBeenCalledTimes(1); // beforeAll -> beforeEach
      expect(summaryContentSpyFn).toHaveBeenCalledTimes(
        Math.ceil(fakeDocument.length / 1900),
      );
      expect(summaryContentSpyFn).toHaveBeenCalledWith(expect.any(Object));
      expect(typeof result.summary).toBe('string');
    });
  });
});

describe('CategoryService', () => {
  let service: CategoryService;
  let categoryRepository: MockRepository<CategoryRepository>;
  let usersRepository: MockRepository<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoryService,
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository(),
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository(),
        },
        {
          provide: DataSource,
          useClass: class MockDataSource {},
        },
      ],
    }).compile();

    service = module.get<CategoryService>(CategoryService);
    categoryRepository = module.get(getRepositoryToken(Category));
    usersRepository = module.get(getRepositoryToken(User));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('loadRecentCategories', () => {
    const fakeUser: User = {
      id: 1,
      name: 'hou27',
      email: '',
      password: '',
      role: UserRole.Client,
      verified: false,
      hashPassword: jest.fn(),
      checkPassword: jest.fn(),
      createdAt: undefined,
      updatedAt: undefined,
      categories: [],
    };
    const fakeCategories: Category[] = [
      {
        id: 1,
        createdAt: undefined,
        updatedAt: undefined,
        name: 'Dev',
        slug: 'Dev',
        userId: 1,
        collections: [],
        contents: [],
        user: undefined,
      },
      {
        id: 2,
        createdAt: undefined,
        updatedAt: undefined,
        name: '쇼핑리스트',
        slug: '쇼핑리스트',
        userId: 1,
        collections: [],
        contents: [],
        user: undefined,
      },
      {
        id: 3,
        createdAt: undefined,
        updatedAt: undefined,
        name: '운동',
        slug: '운동',
        userId: 1,
        collections: [],
        contents: [],
        user: undefined,
      },
      {
        id: 4,
        createdAt: undefined,
        updatedAt: undefined,
        name: '여행',
        slug: '여행',
        userId: 1,
        collections: [],
        contents: [],
        user: undefined,
      },
      {
        id: 5,
        createdAt: undefined,
        updatedAt: undefined,
        name: '꿀팁',
        slug: '꿀팁',
        userId: 1,
        collections: [],
        contents: [],
        user: undefined,
      },
      {
        id: 6,
        createdAt: undefined,
        updatedAt: undefined,
        name: '데이터분석',
        slug: '데이터분석',
        userId: 1,
        collections: [],
        contents: [],
        user: undefined,
      },
    ];

    fakeUser.categories = [...fakeCategories];

    it('최초 호출에서 n번자리가 모두 확정된 경우', async () => {
      usersRepository.findOne.mockReturnValue(fakeUser);

      categoryRepository.findOne.mockImplementation(({ where: { id } }) => {
        return fakeCategories.find((category) => category.id === id);
      });

      // 콘텐츠 저장 기록
      /**
       * Dev : categoryId 1
       * 쇼핑리스트 : categoryId 2
       * 꿀팁 : categoryId 5
       * 데이터분석 : categoryId 6
       *
       * 2023.01.15 07:30:00 Dev에 저장
       * 2023.01.15 07:25:00 쇼핑리스트에 저장
       * 2023.01.15 07:15:00 Dev에 저장
       * 2023.01.10 21:00:00 꿀팁에 저장
       * 2023.01.10 20:50:00 Dev에 저장
       * 2022.12.29 09:00:00 데이터분석에 저장
       * 2022.06.20 20:45:00 쇼핑리스트에 저장
       * 2022.06.20 20:50:00 Dev에 저장
       * 2022.06.20 20:10:00 Dev에 저장
       * 2022.06.17 01:30:00 Dev에 저장
       */
      const recentCategoryList: RecentCategoryList[] = [
        { categoryId: 1, savedAt: new Date('2023-01-15 07:30:00').getTime() },
        { categoryId: 2, savedAt: new Date('2023-01-15 07:25:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-15 07:15:00').getTime() },
        { categoryId: 5, savedAt: new Date('2023-01-10 21:00:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-10 20:50:00').getTime() },
        { categoryId: 6, savedAt: new Date('2022-12-29 09:00:00').getTime() },
        { categoryId: 2, savedAt: new Date('2022-06-20 20:45:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-20 20:50:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-20 20:10:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-17 01:30:00').getTime() },
      ];

      service.loadLogs = jest.fn().mockReturnValue(recentCategoryList);

      const { recentCategories } = await service.loadRecentCategories(fakeUser);

      expect(recentCategories).toHaveLength(3);
      expect(recentCategories[0].id).toBe(1);
      expect(recentCategories[1].id).toBe(2);
      expect(recentCategories[2].id).toBe(5);
    });

    it('최초 호출에서 n번자리가 모두 확정되지 않은 경우', async () => {
      usersRepository.findOne.mockReturnValue(fakeUser);

      categoryRepository.findOne.mockImplementation(({ where: { id } }) => {
        return fakeCategories.find((category) => category.id === id);
      });

      // 콘텐츠 저장 기록
      /**
       * Dev : categoryId 1
       * 쇼핑리스트 : categoryId 2
       * 운동 : categoryId 3
       * 여행 : categoryId 4
       * 꿀팁 : categoryId 5
       * 데이터분석 : categoryId 6
       *
       * 2023.01.15 07:30:00 Dev에 저장
       * 2023.01.15 07:25:00 Dev에 저장
       * 2023.01.15 07:15:00 Dev에 저장
       * 2023.01.10 21:00:00 Dev에 저장
       * 2023.01.10 20:50:00 Dev에 저장
       * 2022.12.29 09:00:00 Dev에 저장
       * 2022.06.20 20:45:00 Dev에 저장
       * 2022.06.20 20:50:00 Dev에 저장
       * 2022.06.20 20:10:00 Dev에 저장
       * 2022.06.17 01:30:00 Dev에 저장
       *
       * 2022.06.16 07:30:00 Dev에 저장
       * 2022.05.10 08:25:00 운동에 저장
       * 2022.05.03 14:00:00 꿀팁에 저장
       * 2022.05.02 20:30:00 운동에 저장
       * 2022.05.02 20:30:00 운동에 저장
       * 2022.04.29 09:00:00 쇼핑리스트에 저장
       * 2022.04.20 23:55:00 여행에 저장
       * 2022.04.20 23:45:00 꿀팁에 저장
       * 2022.04.20 23:00:00 꿀팁에 저장
       */
      const recentCategoryList: RecentCategoryList[] = [
        { categoryId: 1, savedAt: new Date('2023-01-15 07:30:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-15 07:25:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-15 07:15:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-10 21:00:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-10 20:50:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-12-29 09:00:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-20 20:45:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-20 20:50:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-20 20:10:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-17 01:30:00').getTime() },
        { categoryId: 1, savedAt: new Date('2022-06-16 07:30:00').getTime() },
        { categoryId: 3, savedAt: new Date('2022-05-10 08:25:00').getTime() },
        { categoryId: 5, savedAt: new Date('2022-05-03 14:00:00').getTime() },
        { categoryId: 3, savedAt: new Date('2022-05-02 20:30:00').getTime() },
        { categoryId: 3, savedAt: new Date('2022-05-02 20:30:00').getTime() },
        { categoryId: 2, savedAt: new Date('2022-04-29 09:00:00').getTime() },
        { categoryId: 4, savedAt: new Date('2022-04-20 23:55:00').getTime() },
        { categoryId: 5, savedAt: new Date('2022-04-20 23:45:00').getTime() },
        { categoryId: 5, savedAt: new Date('2022-04-20 23:00:00').getTime() },
      ];

      service.loadLogs = jest.fn().mockReturnValue(recentCategoryList);

      const { recentCategories } = await service.loadRecentCategories(fakeUser);

      expect(recentCategories).toHaveLength(3);
      expect(recentCategories[0].id).toBe(1);
      expect(recentCategories[1].id).toBe(3);
      expect(recentCategories[2].id).toBe(5);
    });

    it('전체 저장한 콘텐츠가 하나의 카테고리 안에 3개인 경우', async () => {
      usersRepository.findOne.mockReturnValue(fakeUser);

      categoryRepository.findOne.mockImplementation(({ where: { id } }) => {
        return fakeCategories.find((category) => category.id === id);
      });

      // 콘텐츠 저장 기록
      /**
       * Dev : categoryId 1
       *
       * 2023.01.15 07:30:00 Dev에 저장
       * 2023.01.15 07:25:00 Dev에 저장
       * 2023.01.15 07:15:00 Dev에 저장
       */
      const recentCategoryList: RecentCategoryList[] = [
        { categoryId: 1, savedAt: new Date('2023-01-15 07:30:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-15 07:25:00').getTime() },
        { categoryId: 1, savedAt: new Date('2023-01-15 07:15:00').getTime() },
      ];

      service.loadLogs = jest.fn().mockReturnValue(recentCategoryList);

      const { recentCategories } = await service.loadRecentCategories(fakeUser);

      expect(recentCategories).toHaveLength(1);
      expect(recentCategories[0].id).toBe(1);
    });

    it('저장 횟수 공동 1번이 있는 경우', async () => {
      usersRepository.findOne.mockReturnValue(fakeUser);

      categoryRepository.findOne.mockImplementation(({ where: { id } }) => {
        return fakeCategories.find((category) => category.id === id);
      });

      // 콘텐츠 저장 기록
      /**
       * Dev : categoryId 1
       * 쇼핑리스트 : categoryId 2
       * 운동 : categoryId 3
       *
       * 2023.01.15 07:30:00 Dev에 저장
       * 2023.01.15 07:25:00 운동에 저장
       * 2023.01.15 07:15:00 쇼핑리스트에 저장
       */
      const recentCategoryList: RecentCategoryList[] = [
        { categoryId: 1, savedAt: new Date('2023-01-15 07:30:00').getTime() },
        { categoryId: 3, savedAt: new Date('2023-01-15 07:25:00').getTime() },
        { categoryId: 2, savedAt: new Date('2023-01-15 07:15:00').getTime() },
      ];

      service.loadLogs = jest.fn().mockReturnValue(recentCategoryList);

      const { recentCategories } = await service.loadRecentCategories(fakeUser);

      expect(recentCategories).toHaveLength(3);
      expect(recentCategories[0].id).toBe(1);
      expect(recentCategories[1].id).toBe(3);
      expect(recentCategories[2].id).toBe(2);
    });
  });
});
