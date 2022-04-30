import { getLocalTime } from '../../utils';

const INVALID_COMMAND = 'คำสั่งไม่ถูกต้องค่ะ';
const NOT_REGISTER = 'คุณยังไม่ได้ลงทะเบียนค่ะ';

export { INVALID_COMMAND, NOT_REGISTER };

export function qrcodeReply(exp: number): string {
  return `สวัสดีค่ะ นี่คือบอทจาก server __**Axie family**__ นะคะ\nqrcode นี้จะหมดอายุตามเวลานี้ค่ะ __**${getLocalTime(
    exp,
  )}**__\n__**กรุณาอย่านำเอา QR code นี้ไปเผยแพร่หรือให้ผู้อื่นนะคะ!!**__`;
}

export function statusReply(result): string {
  return `
    ชื่อ: __**${result.name}**__
    MMR: __**${result.mmr}**__
    Rank: __**${result.rank}**__
    SLP ที่ยังรอการ claim : __**${result.in_game_slp}**__
    รวม SLP ทั้งหมดที่เคย claim ออกมาแล้ว: __**${result.lifetime_slp}**__
    claim เหรียญครั้งล่าสุด: __**${getLocalTime(result.last_claim)}**__
    claim เหรียญครั้งต่อไป: __**${getLocalTime(result.next_claim)}**__

    ปล. ข้อมูลชุดนี้ไม่ได้ update ข้อมูลแบบ real time
  `;
}

export function help(): string {
  const msg = `
    คำสั่งที่ใช้ได้มีดังนี้
    \`#ผู้จัดการ\`        => help
    \`#ผู้จัดการ status\` => เช็คข้อมูลทั่วไปของคุณเอง
    \`#ผู้จัดการ qrcode\` => ขอ qrcode
    \`#ผู้จัดการ claim\`  => ทำการ claim เหรียญ SLP เมื่อถึงรอบ claim ปล. ควรเช็ค status เพื่อดูเลขหมายปลายทางเหรียญว่าตรงกับกระเป๋า ronin ของคุณหรือไม่
  `;
  return msg;
}
