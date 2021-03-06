import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class Member {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  discordTag: string;

  @Column()
  teamId: number;

  @Column()
  ownerRonin: string;

  @Column()
  scholarRonin: string;

  @Column()
  profitShared: number;
}
