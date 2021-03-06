import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxieApiService } from 'src/axie-api/axie-api.service';
import { Secret } from 'src/config/interface/config.interface';
import { Member } from 'src/member/entities/member.entity';
import { ContractService } from './contract/contract.service';
import { Claim } from './interfaces/claim.interface';

import { RoninHelperService } from './ronin-helper/ronin-helper.service';

@Injectable()
export class ContractHelperService implements OnModuleInit {
  private logger = new Logger(ContractHelperService.name);
  private privateKeys: string[];

  constructor(
    private readonly roninHelperService: RoninHelperService,
    private readonly contractService: ContractService,
    private readonly axieApiService: AxieApiService,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit() {
    const secrets = this.configService.get<Secret[]>('secrets', []);
    this.privateKeys = secrets.map((secret) => secret.key);
    this.contractService.activateAccount(this.privateKeys);
  }

  async transfer(from: string, to: string, amount: number) {
    this.contractService.setTxDefaultAddress(from);
    try {
      const contractResult = await this.contractService.transferToken(
        from,
        to,
        amount,
      );
      return contractResult.transactionHash;
    } catch (error) {
      this.logger.error(error);
      return undefined;
    }
  }

  async claim(member: Member): Promise<Claim> {
    // check claimable
    this.logger.log('start claim process');
    const { lastClaimedItemAt, unclaimed } =
      await this.axieApiService.fetchPayableAccount(member.ownerRonin);

    this.logger.log(
      `last claim is past [${this.isPast(
        lastClaimedItemAt,
      )}], claimable is [${unclaimed}]`,
    );

    if (unclaimed === 0) {
      if (!this.isPast(lastClaimedItemAt)) {
        this.logger.warn('claim is unable');
        return {
          address: member.ownerRonin,
          hash: undefined,
          isCompleted: false,
          msg: '??????????????????????????????????????? claim ??????????????????',
        };
      }
    }

    // signed token
    const { jwt, privateKey } = await this.getSignedToken(member);
    const { amount, timestamp, signature } =
      await this.roninHelperService.axieClaim(jwt, member.ownerRonin);

    this.logger.log(`claim ${amount}, ${timestamp}`);

    this.contractService.setTxDefaultAddress(member.ownerRonin);
    const nonce = await this.contractService.getNonce(member.ownerRonin);
    const transactionBuilded =
      await this.contractService.buildCheckPointTransaction({
        account: member.ownerRonin,
        amount,
        timestamp,
        signature,
      });

    this.logger.log(`nonce, ${nonce}`);

    const signedClaim = await this.contractService.signClaim(
      {
        nonce: await this.contractService.numberToHexStr(nonce),
        from: member.ownerRonin,
        to: this.configService.get<string>('SLP_CONTRACT', ''),
        gas: await this.contractService.numberToHexStr(1000000),
        gasPrice: '0x00',
        value: '0x00',
        data: transactionBuilded,
      },
      privateKey,
    );

    const balanceBeforeClaim = await this.contractService.getBalanceOf(
      member.ownerRonin,
    );

    this.logger.log('send Transaction');
    this.contractService
      .sendTransaction(signedClaim.rawTransaction)
      .then((result) => {
        this.logger.log(`receipt ${result}`);
      })
      .catch((error) => {
        this.logger.error(`error`, error);
      });

    const result = await this.waitingForClaim(balanceBeforeClaim, member);
    result.balance;
    if (!result.isCompleted)
      return {
        address: member.ownerRonin,
        hash: undefined,
        isCompleted: false,
        msg: '??????????????????????????????????????????????????????????????? wallet',
      };

    // TODO transfer token
    const scholarProfit = Math.floor(
      (member.profitShared / 100.0) * result.balance,
    );
    const remainSLP = result.balance - scholarProfit;

    this.logger.log(
      `before ${balanceBeforeClaim} claim ${result.balance} token, status ${result.isCompleted}`,
    );
    this.logger.log(
      `profit shared: ${member.profitShared}% => ${scholarProfit} SLP`,
    );

    const ownerAddress = this.configService.get<string>(
      'DESTINATION_HOLDER_ADDRESS',
      '',
    );
    const txHash = await this.transfer(
      member.ownerRonin,
      member.scholarRonin,
      scholarProfit,
    );
    const txHashOwner = await this.transfer(
      member.ownerRonin,
      ownerAddress,
      remainSLP,
    );

    this.logger.warn(
      `slp is already sent, to scholar txHash [${txHash}], to owner txHash[${txHashOwner}]`,
    );

    return {
      address: member.ownerRonin,
      hash: txHash,
      isCompleted: true,
      msg: '???????????????????????????????????????????????????',
    };
  }

  async getSignedToken(
    member: Member,
  ): Promise<{ jwt: string; privateKey: string }> {
    // get privatekey by member
    const privateKey = this.getOwnKey(member);

    // sign token
    const randomMessage = await this.roninHelperService.createRandomMessage();
    const signedMsg = await this.contractService.signedMessage(
      randomMessage,
      privateKey,
    );
    const jwt = await this.roninHelperService.axieLogin(
      signedMsg,
      member.ownerRonin,
    );

    return {
      jwt,
      privateKey,
    };
  }

  private getOwnKey(member: Member): string {
    const privateKey = this.privateKeys[member.teamId];
    return privateKey;
  }

  private addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  private isPast(targetTime: number): boolean {
    // next claim in 14 days
    const target = this.addDays(targetTime * 1000, 14).getTime();
    const now = Date.now();

    this.logger.log(`compare date ${now} and ${target}`);
    const diff = now - target;
    return diff >= 0;
  }

  private waitingForClaim(
    balanceBefor: number,
    member: Member,
    timeout: number = 2 * 60 * 1000,
  ): Promise<{ balance: number; isCompleted: boolean }> {
    return new Promise((resolve) => {
      let count = 0;
      const checkBalance = setInterval(async () => {
        console.log('waiting..');
        if (count >= timeout) {
          resolve({
            balance: 0,
            isCompleted: false,
          });
          clearInterval(checkBalance);
        }

        const balanceNew = await this.contractService.getBalanceOf(
          member.ownerRonin,
        );

        if (balanceNew > balanceBefor) {
          resolve({
            balance: balanceNew,
            isCompleted: true,
          });
          clearInterval(checkBalance);
        }

        count = count + 1000;
      }, 1000);
    });
  }
}
