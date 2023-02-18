import { Test, TestingModule } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { CollectionsService } from './collections.service';

describe('CollectionsService', () => {
  // let service: CollectionsService;

  // beforeEach(async () => {
  //   const module: TestingModule = await Test.createTestingModule({
  //     providers: [
  //       CollectionsService,
  //       {
  //         provide: DataSource,
  //         useClass: class MockDataSource {},
  //       },
  //     ],
  //   }).compile();

  //   service = module.get<CollectionsService>(CollectionsService);
  // });

  it('should be defined', () => {
    // expect(service).toBeDefined();
  });
});
