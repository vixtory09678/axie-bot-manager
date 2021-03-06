import { Injectable } from '@nestjs/common';
import QRCode from 'qrcode';

@Injectable()
export class QRCodeService {
  async getQRCodeBuffer(msg: string): Promise<Buffer> {
    return QRCode.toBuffer(msg);
  }
}
