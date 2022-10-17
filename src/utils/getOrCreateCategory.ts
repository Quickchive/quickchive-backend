// import { Category } from 'src/contents/entities/category.entity';
// import { EntityManager } from 'typeorm';

// export default async function getOrCreateCategory(
//   name: string,
//   queryRunnerManager: EntityManager,
// ): Promise<Category> {
//   const categoryName = name.trim().toLowerCase();
//   const categorySlug = categoryName.replace(/ /g, '-');
//   let category = await queryRunnerManager.findOneBy(Category, {
//     slug: categorySlug,
//   });

//   if (!category) {
//     category = await queryRunnerManager.save(
//       queryRunnerManager.create(Category, {
//         slug: categorySlug,
//         name: categoryName,
//       }),
//     );
//   }

//   return category;
// }
