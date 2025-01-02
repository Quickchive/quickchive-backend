export interface Seeder<T> {
  generateOne(options?: Partial<T>): T;
}
