export function getLocalTime(time: number) {
  return new Date(time * 1000).toLocaleString('th-TH', {
    timeZone: 'Asia/Bangkok',
  });
}
