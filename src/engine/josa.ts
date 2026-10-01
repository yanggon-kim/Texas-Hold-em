// 한국어 조사 도우미 — 앞 단어의 받침에 맞춰 이/가, 은/는, 을/를, 와/과, 으로/로를 고릅니다.

export type JosaPair = '이/가' | '은/는' | '을/를' | '과/와' | '으로/로';

// 숫자를 읽었을 때 마지막 소리의 받침 (0=없음, 8=ㄹ, 그 밖=다른 받침).
// 영(ㅇ) 일(ㄹ) 이 삼(ㅁ) 사 오 육(ㄱ) 칠(ㄹ) 팔(ㄹ) 구
const DIGIT_JONG = [21, 8, 0, 16, 0, 0, 1, 8, 8, 0];

// 영문자를 읽었을 때의 받침 (L=엘, M=엠, N=엔, R=알은 받침이 있음).
const LETTER_JONG: Record<string, number> = { L: 8, M: 16, N: 4, R: 8 };

/** 단어 마지막 소리의 받침 번호 (0이면 받침 없음, 8이면 ㄹ). */
function finalConsonant(word: string): number {
  const trimmed = word.replace(/[\s.,!?)\]'"%]+$/u, '');
  const last = trimmed.charAt(trimmed.length - 1);
  if (!last) return 0;
  const code = last.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28;
  if (/[0-9]/.test(last)) {
    // 10, 100 등은 "십", "백"으로 끝납니다.
    if (/[1-9]0$/.test(trimmed)) return 17; // 십(ㅂ)
    return DIGIT_JONG[Number(last)];
  }
  return LETTER_JONG[last.toUpperCase()] ?? 0;
}

/** `word` 뒤에 알맞은 조사를 붙여 돌려줍니다. 예: josa('트리플', '이/가') → '트리플이'. */
export function josa(word: string, pair: JosaPair): string {
  const jong = finalConsonant(word);
  const [withFinal, withoutFinal] = pair.split('/');
  if (pair === '으로/로') return word + (jong === 0 || jong === 8 ? '로' : '으로');
  return word + (jong === 0 ? withoutFinal : withFinal);
}
