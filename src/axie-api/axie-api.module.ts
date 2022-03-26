import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { AxieApiService } from './axie-api.service';

@Module({
  imports: [HttpModule],
  providers: [AxieApiService],
  exports: [AxieApiService],
})
export class AxieApiModule {}
