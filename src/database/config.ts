import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { SnakeNamingStrategy } from 'typeorm-naming-strategies';

const databaseProviders = (configService: ConfigService) => {
  const config: TypeOrmModuleOptions = {
    type: 'postgres',
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'root'),
    password: configService.get<string>('DB_PASSWORD', 'password'),
    database: configService.get<string>('DB_NAME', 'db_name'),
    entities: [__dirname + '/../**/*.entity{.ts,.js}'],
    namingStrategy: new SnakeNamingStrategy(),
    synchronize: true,
  };
  return config;
};

export { databaseProviders };
