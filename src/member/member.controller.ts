import { Body, Controller, Delete, Get, Post, Query } from '@nestjs/common';
import { CreateMemberDto } from './dto/member.dto';
import { Member } from './entities/member.entity';
import { MemberService } from './member.service';

@Controller('member')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @Post()
  async addUser(@Body() member: CreateMemberDto): Promise<Member> {
    const memberEntity: Member = new Member();

    memberEntity.discordTag = member.discordTag;
    memberEntity.teamId = member.teamId;
    memberEntity.ownerRonin = member.ownerRonin;
    memberEntity.scholarRonin = member.scholarRonin;
    memberEntity.profitShared = member.profitShared;

    return await this.memberService.createUser(memberEntity);
  }

  @Get()
  async getAllUser(): Promise<Member[]> {
    return await this.memberService.getAllUser();
  }

  @Get()
  async getUser(@Query('discord_id') discord_id: string): Promise<Member> {
    return await this.memberService.getUser(discord_id);
  }

  @Delete()
  async deleteUser(@Body('discord_id') discord_id: string): Promise<void> {
    await this.memberService.removeUser(discord_id);
  }
}
