import { describe, it, expect } from 'vitest';
import { josa } from '../src/engine/josa';

describe('josa — 받침에 맞는 조사', () => {
  it('받침이 없으면 가/는/를/와/로를 붙인다', () => {
    expect(josa('플러시', '이/가')).toBe('플러시가');
    expect(josa('하트', '은/는')).toBe('하트는');
    expect(josa('풀하우스', '을/를')).toBe('풀하우스를');
    expect(josa('포카드', '과/와')).toBe('포카드와');
    expect(josa('스트레이트', '으로/로')).toBe('스트레이트로');
  });

  it('받침이 있으면 이/은/을/과/으로를 붙인다', () => {
    expect(josa('트리플', '이/가')).toBe('트리플이');
    expect(josa('클럽', '은/는')).toBe('클럽은');
    expect(josa('클럽', '을/를')).toBe('클럽을');
    expect(josa('클럽', '으로/로')).toBe('클럽으로');
  });

  it('ㄹ 받침 뒤에는 "로"를 붙인다', () => {
    expect(josa('트리플', '으로/로')).toBe('트리플로');
  });

  it('숫자는 읽는 소리에 맞춘다', () => {
    expect(josa('3', '이/가')).toBe('3이'); // 삼
    expect(josa('2', '이/가')).toBe('2가'); // 이
    expect(josa('10', '은/는')).toBe('10은'); // 십
    expect(josa('7', '으로/로')).toBe('7로'); // 칠
  });
});
