import { IsEthereumAddress, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateMemberDto {
  @IsNotEmpty()
  discordTag: string;

  @IsNumber()
  teamId: number;

  @IsNotEmpty()
  @IsEthereumAddress()
  ownerRonin: string;

  @IsNotEmpty()
  @IsEthereumAddress()
  scholarRonin: string;

  @IsNumber()
  profitShared: number;
}
