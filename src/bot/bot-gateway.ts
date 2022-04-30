import { Injectable, Logger } from '@nestjs/common';
import { Content, Context, On, OnCommand } from 'discord-nestjs';
import { Message } from 'discord.js';
import { AxieApiService } from 'src/axie-api/axie-api.service';
import { ContractHelperService } from 'src/contract-helper/contract-helper.service';
import { MemberService } from 'src/member/member.service';
import { QRCodeService } from './qrcode/qrcode.service';
import {
  qrcodeReply,
  help,
  statusReply,
  INVALID_COMMAND,
  NOT_REGISTER,
} from './reply';
import jwtDecode from 'jwt-decode';
import { Member } from 'src/member/entities/member.entity';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  constructor(
    private readonly axieApiService: AxieApiService,
    private readonly memberService: MemberService,
    private readonly contractHelperService: ContractHelperService,
    private readonly qrcodeService: QRCodeService,
  ) {}

  @On({ event: 'ready' })
  async onReady(): Promise<void> {
    this.logger.log('bot is running.');
  }

  @OnCommand({ name: 'ผู้จัดการ' })
  async onCommandTest(
    @Content() content: string,
    @Context() [context]: [Message],
  ): Promise<void> {
    if (content.length === 0) {
      context.reply(help());
      return;
    }

    const discordTag = context.author.tag;
    const command = content.split(' ');

    if (!this._validateCommand(command)) {
      context.reply(INVALID_COMMAND);
      return;
    }

    const member = await this.memberService.getUser(discordTag);

    // member is not exists
    if (!member) {
      context.reply(NOT_REGISTER);
      return;
    }

    this.logger.log(
      `user [${discordTag}] ronin address '${member.ownerRonin}' request for ${command[0]}`,
    );

    switch (command[0]) {
      case 'status':
        await this._replyStatus(context, member);
        break;

      case 'claim':
        context.reply('กำลังดำเนินการค่ะ โปรดรอสักครู่..');
        const { address, hash, isCompleted, msg } =
          await this.contractHelperService.claim(member);

        if (!isCompleted) {
          this.logger.error('transaction fail', address);
          context.reply(
            `\nไม่สามารถเคลมเหรียญได้ค่ะ ลองพิมพ์ \`#ผู้จัดการ status\` เพื่อเช็คสถานะอีกครั้ง \nข้อความผิดพลาด: __${msg}__`,
          );
          return;
        }

        this.logger.log('claim completed');
        context.reply(
          `ยืนยันการดำเนินการเสร็จสิ้น สามารถดูใบเสร็จได้ที่ https://explorer.roninchain.com/tx/${hash}`,
        );
        break;

      case 'qrcode':
        const { jwt } = await this.contractHelperService.getSignedToken(member);
        const decode = jwtDecode<{ exp: number }>(jwt);
        const qrcodeLogin = await this.qrcodeService.getQRCodeBuffer(jwt);

        // send message to user
        context.reply(
          'ส่ง QRCode ไปที่ Direct Message แล้วนะคะ โปรดเช็คดูด้วยค่ะ',
        );
        context.author.send(qrcodeReply(decode.exp));
        context.author.send({
          files: [
            {
              attachment: qrcodeLogin,
            },
          ],
        });

        break;
      default:
        context.reply(`คำสั่งไม่ถูกต้องค่ะ`);
        break;
    }
  }

  private async _replyStatus(context, member: Member): Promise<void> {
    // find user in database
    const result = await this.axieApiService.getAccountInformation(
      member.ownerRonin,
    );
    if (!result) context.reply(`ไม่สามารถใช้บริการได้`);

    context.reply(`
    เลขกระเป๋าปลายทาง => [${member.scholarRonin}]
    `);
    context.reply(statusReply(result));
  }

  private _validateCommand(command: string[]): boolean {
    if (command.length < 1) return false;
    return true;
  }
}
