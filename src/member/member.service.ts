import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member) private readonly memberRepo: Repository<Member>,
  ) {}

  async createUser(memberInfo: Member): Promise<Member> {
    console.log(memberInfo);
    const result = await this.memberRepo.find({
      where: {
        discordTag: memberInfo.discordTag,
      },
    });

    if (result.length > 0)
      throw new BadRequestException('this account has already exists');

    return await this.memberRepo.save(memberInfo);
  }

  async getUserByRonin(roninAddress: string): Promise<Member> {
    return await this.memberRepo.findOne({
      where: {
        roninOwner: roninAddress,
      },
    });
  }

  async getUser(discordTag: string): Promise<Member> {
    return await this.memberRepo.findOne({
      where: {
        discordTag,
      },
    });
  }

  async getAllUser(limit = 15): Promise<Member[]> {
    return await this.memberRepo.find({
      take: limit,
    });
  }

  async updateUser(id: number, memberInfo: Member): Promise<Member> {
    return await this.memberRepo.save({
      id: id,
      memberInfo,
    });
  }

  async removeUser(discordId: string): Promise<void> {
    await this.memberRepo.delete({
      discordTag: discordId,
    });
  }
}
