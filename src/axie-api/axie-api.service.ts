import { HttpService } from '@nestjs/axios';
import { Injectable, Logger } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class AxieApiService {
  private axie_api = 'https://game-api.axie.technology/api/v1/';
  private readonly logger = new Logger(AxieApiService.name);

  constructor(private readonly httpService: HttpService) {}

  async getAccountInformation(roninAddress: string) {
    const api = this.axie_api + roninAddress;
    const result = await lastValueFrom(this.httpService.get(api));
    console.log(result.data);
    return result.data;
  }

  async fetchPayableAccount(roninAddress: string) {
    const result = await lastValueFrom(
      this.httpService.get(
        `https://game-api.skymavis.com/game-api/clients/${roninAddress}/items/1`,
      ),
    );
    return {
      address: roninAddress,
      lastClaimedItemAt: result.data.last_claimed_item_at,
      unclaimed: result.data.claimable_total,
      blockchainRelated: result.data.blockchain_related.signature,
    };
  }
}
