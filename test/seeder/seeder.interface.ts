export interface Seeder<T> {
  generateOne(options?: { [K in keyof T]: any }): T;
}
