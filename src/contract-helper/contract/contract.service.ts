import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';
import { slp_abi } from './abi/slp-abi';

@Injectable()
export class ContractService {
  private web3: Web3;
  private web3Tx: Web3;
  private slp_contract: Contract;
  private slpContractTx: Contract;
  private logger = new Logger(ContractService.name);

  constructor(private readonly configService: ConfigService) {}

  activateAccount(privateKeys: string[]) {
    const SLP_CONTRACT_ADDRESS = this.configService.get<string>(
      'SLP_CONTRACT',
      '',
    );

    const PROVIDER_URL = this.configService.get<string>('RONIN_PROVIDER', '');
    const PROVIDER_FREE_URL = this.configService.get<string>(
      'RONIN_FREE_PROVIDER',
      '',
    );

    this.web3 = new Web3(PROVIDER_URL);
    this.web3Tx = new Web3(PROVIDER_FREE_URL);

    privateKeys.forEach((key) => {
      const account1 = this.web3Tx.eth.accounts.privateKeyToAccount(key);
      this.web3Tx.eth.accounts.wallet.add(account1);

      const account2 = this.web3.eth.accounts.privateKeyToAccount(key);
      this.web3.eth.accounts.wallet.add(account2);
    });

    this.slp_contract = new this.web3.eth.Contract(
      slp_abi,
      SLP_CONTRACT_ADDRESS,
    );
    this.slpContractTx = new this.web3Tx.eth.Contract(
      slp_abi,
      SLP_CONTRACT_ADDRESS,
    );
    this.logger.log('init web3');
  }

  setTxDefaultAddress(address: string) {
    this.web3Tx.eth.defaultAccount = address;
  }

  async buildCheckPointTransaction({ account, amount, timestamp, signature }) {
    const claim = await this.slp_contract.methods
      .checkpoint(
        Web3.utils.toChecksumAddress(account),
        amount,
        timestamp,
        signature,
      )
      .encodeABI();

    return claim;
  }

  async getNonce(account: string) {
    return this.web3.eth.getTransactionCount(
      Web3.utils.toChecksumAddress(account),
      'pending',
    );
  }

  signClaim(transactionBuilded, privateKey) {
    return this.web3Tx.eth.accounts.signTransaction(
      transactionBuilded,
      privateKey,
    );
  }

  async sendTransaction(signedClaim) {
    return this.web3Tx.eth
      .sendSignedTransaction(signedClaim)
      .once('receipt', function (receipt) {
        console.log('receipt', receipt);
      })
      .on('confirmation', function (confNumber, receipt, latestBlockHash) {
        console.log('confirmed', confNumber, receipt, latestBlockHash);
      })
      .on('error', function (error) {
        console.log('error', error);
      });
  }

  async transferToken(from: string, to: string, amount: number) {
    return this.slpContractTx.methods.transfer(to, amount).send({
      gas: await this.numberToHexStr(1000000),
      gasPrice: '0x00',
      value: '0x00',
      from,
    });
  }

  async getBalanceOf(roninAddress: string) {
    return this.slp_contract.methods.balanceOf(roninAddress).call();
  }

  async getTransactionHash(signedClaim: string) {
    return this.web3.utils.toHex(this.web3.utils.keccak256(signedClaim));
  }

  async numberToHexStr(count: number): Promise<string> {
    return this.web3.utils.toHex(count);
  }

  async getTransactionReceipt(hash: string) {
    return this.web3.eth.getTransactionReceipt(hash);
  }

  async signedMessage(msg, privateKey) {
    return await this.web3.eth.accounts.sign(msg, privateKey);
  }
}
