import { Injectable, Logger } from '@nestjs/common';
import { Content, Context, On, OnCommand } from 'discord-nestjs';
import { Message } from 'discord.js';
import { AxieApiService } from 'src/axie-api/axie-api.service';
import { ContractHelperService } from 'src/contract-helper/contract-helper.service';
import { MemberService } from 'src/member/member.service';
import { QRCodeService } from './qrcode/qrcode.service';
import jwtDecode from 'jwt-decode';

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
      context.reply(this.help());
      return;
    }

    const discordTag = context.author.tag;
    const command = content.split(' ');

    if (!this.validateCommand(command)) {
      context.reply(`คำสั่งไม่ถูกต้องค่ะ`);
      return;
    }

    const member = await this.memberService.getUser(discordTag);

    // member is not exists
    if (!member) {
      context.reply(`คุณยังไม่ได้ลงทะเบียนค่ะ`);
      return;
    }

    this.logger.log(
      `user [${discordTag}] ronin address '${member.ownerRonin}' request for ${command[0]}`,
    );

    switch (command[0]) {
      case 'status':
        // find user in database
        const result = await this.axieApiService.getAccountInformation(
          member.ownerRonin,
        );
        if (!result) context.reply(`ไม่สามารถใช้บริการได้`);

        context.reply(`
        เลขกระเป๋าปลายทาง => [${member.scholarRonin}]
        `);
        context.reply(this.statusReply(result));
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
        context.author.send(this.qrcodeReply(decode.exp));
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

  private qrcodeReply(exp: number): string {
    return `สวัสดีค่ะ นี่คือบอทจาก server __**Axie family**__ นะคะ\nqrcode นี้จะหมดอายุตามเวลานี้ค่ะ __**${this.getLocalTime(
      exp,
    )}**__\n__**กรุณาอย่านำเอา QR code นี้ไปเผยแพร่หรือให้ผู้อื่นนะคะ!!**__`;
  }

  private statusReply(result): string {
    return `
      ชื่อ: __**${result.name}**__
      MMR: __**${result.mmr}**__
      Rank: __**${result.rank}**__
      SLP ที่ยังรอการ claim : __**${result.in_game_slp}**__
      รวม SLP ทั้งหมดที่เคย claim ออกมาแล้ว: __**${result.lifetime_slp}**__
      claim เหรียญครั้งล่าสุด: __**${this.getLocalTime(result.last_claim)}**__
      claim เหรียญครั้งต่อไป: __**${this.getLocalTime(result.next_claim)}**__

      ปล. ข้อมูลชุดนี้ไม่ได้ update ข้อมูลแบบ real time
    `;
  }

  private help(): string {
    const msg = `
      คำสั่งที่ใช้ได้มีดังนี้
      \`#ผู้จัดการ\`        => help
      \`#ผู้จัดการ status\` => เช็คข้อมูลทั่วไปของคุณเอง
      \`#ผู้จัดการ qrcode\` => ขอ qrcode
      \`#ผู้จัดการ claim\`  => ทำการ claim เหรียญ SLP เมื่อถึงรอบ claim ปล. ควรเช็ค status เพื่อดูเลขหมายปลายทางเหรียญว่าตรงกับกระเป๋า ronin ของคุณหรือไม่
    `;
    return msg;
  }

  private getLocalTime(time: number) {
    return new Date(time * 1000).toLocaleString('th-TH', {
      timeZone: 'Asia/Bangkok',
    });
  }

  private validateCommand(command: string[]): boolean {
    if (command.length < 1) return false;
    return true;
  }
}
