import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DiscordModuleOption, DiscordOptionsFactory } from 'discord-nestjs';

@Injectable()
export class DiscordConfigService
  implements DiscordOptionsFactory, OnModuleInit
{
  private token: string;
  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    this.token = this.configService.get<string>('DISCORD_TOKEN', '');
  }

  createDiscordOptions(): DiscordModuleOption {
    return {
      token: this.token,
      commandPrefix: '#',
    };
  }
}
