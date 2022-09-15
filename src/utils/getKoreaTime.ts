export default function getKoreaTime(): Date {
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000; // 현재 시간을 UTC로 변환한 밀리세컨드값
  const koreaTimeDiff = 9 * 60 * 60 * 1000; // 한국 시간과 UTC와의 차이(9시간의 밀리세컨드)
  const koreaNow = new Date(utcNow + koreaTimeDiff); // UTC -> 한국 시간

  return koreaNow;
}
