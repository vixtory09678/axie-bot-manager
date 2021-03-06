import { Module } from '@nestjs/common';
import { BotGateway } from './bot-gateway';
import { DiscordModule } from 'discord-nestjs';
import { DiscordConfigService } from './discord-config.service';
import { AxieApiModule } from 'src/axie-api/axie-api.module';
import { MemberModule } from 'src/member/member.module';
import { QRCodeService } from './qrcode/qrcode.service';
import { ContractHelperModule } from 'src/contract-helper/contract-helper.module';

@Module({
  imports: [
    DiscordModule.forRootAsync({
      useClass: DiscordConfigService,
    }),
    AxieApiModule,
    ContractHelperModule,
    MemberModule,
  ],
  providers: [BotGateway, QRCodeService],
})
export class BotModule {}
