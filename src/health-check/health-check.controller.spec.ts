import { Test, TestingModule } from '@nestjs/testing';
import { HealthCheckController } from './health-check.controller';
import request from 'supertest'
import { INestApplication } from '@nestjs/common';

describe('HealthCheckController', () => {
  let controller: HealthCheckController;
  let app: INestApplication;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthCheckController],
    }).compile();

    app = module.createNestApplication();
    controller = module.get<HealthCheckController>(HealthCheckController);
    await app.init();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should be response status 200', async () => {
    const result = await request(app.getHttpServer()).get('/health-check');
    expect(result.status).toBe(200);
  });
});
