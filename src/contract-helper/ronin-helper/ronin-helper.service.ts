import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { lastValueFrom } from 'rxjs';

@Injectable()
export class RoninHelperService {
  constructor(private readonly httpService: HttpService) {}

  async createRandomMessage() {
    const payload = {
      operationName: 'CreateRandomMessage',
      variables: {},
      query: 'mutation CreateRandomMessage{createRandomMessage}',
    };
    const url = 'https://graphql-gateway.axieinfinity.com/graphql';
    const response = await lastValueFrom(this.httpService.post(url, payload));
    return response.data.data.createRandomMessage;
  }

  async axieLogin(web3SignedMessage, roninAddress: string) {
    const payload = {
      operationName: 'CreateAccessTokenWithSignature',
      variables: {
        input: {
          mainnet: 'ronin',
          owner: roninAddress,
          message: web3SignedMessage.message,
          signature: web3SignedMessage.signature,
        },
      },
      query:
        'mutation CreateAccessTokenWithSignature($input: SignatureInput!)' +
        '{createAccessTokenWithSignature(input: $input) ' +
        '{newAccount result accessToken __typename}}',
    };
    const url = 'https://graphql-gateway.axieinfinity.com/graphql';
    const response = await lastValueFrom(this.httpService.post(url, payload));
    return response.data.data.createAccessTokenWithSignature.accessToken;
  }

  async axieClaim(jwt: string, roninAddress: string) {
    const headers = {
      Authorization: `Bearer ${jwt}`,
    };
    const url = `https://game-api.skymavis.com/game-api/clients/${roninAddress}/items/1/claim`;
    const response = await lastValueFrom(
      this.httpService.post(url, null, { headers }),
    );

    const { amount, timestamp, signature } =
      response.data.blockchain_related.signature;
    return {
      amount,
      timestamp,
      signature,
    };
  }
}
