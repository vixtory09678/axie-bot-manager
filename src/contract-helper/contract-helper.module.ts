import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ContractHelperService } from './contract-helper.service';
import { RoninHelperService } from './ronin-helper/ronin-helper.service';
import { ContractService } from './contract/contract.service';
import { AxieApiModule } from 'src/axie-api/axie-api.module';

@Module({
  imports: [HttpModule, AxieApiModule],
  providers: [ContractHelperService, RoninHelperService, ContractService],
  exports: [ContractHelperService],
})
export class ContractHelperModule {}
