import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { MemberModule } from './member/member.module';
import { AxieApiModule } from './axie-api/axie-api.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { databaseProviders } from './database/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ContractHelperModule } from './contract-helper/contract-helper.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [configuration],
      envFilePath: '.env',
      isGlobal: true,
      ignoreEnvFile: process.env.NODE_ENV === 'production',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: databaseProviders,
      inject: [ConfigService],
    }),
    BotModule,
    MemberModule,
    AxieApiModule,
    ContractHelperModule,
  ],
})
export class AppModule {}
