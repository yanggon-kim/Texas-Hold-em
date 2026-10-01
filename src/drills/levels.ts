import type { LevelDef } from './types';
import { generateCardDrill } from './level01_cards';
import { generateRankingDrill } from './level02_rankings';
import { generateBestHandDrill } from './level03_bestHand';
import { generateTableFlowDrill } from './level04_tableFlow';
import { generateActionsDrill } from './level05_actions';
import { generatePositionDrill } from './level06_position';
import { generateStartingHandDrill } from './level07_startingHands';
import { generateOddsDrill } from './level08_odds';
import { generateBoardDrill } from './level09_board';
import {
  cardsLesson,
  rankingsLesson,
  bestHandLesson,
  tableFlowLesson,
  actionsLesson,
  positionLesson,
  startingHandsLesson,
  oddsLesson,
  boardLesson,
  tablePlayLesson,
} from './lessons';

/**
 * 커리큘럼.
 *   레벨 1–3: 규칙 익히기.   레벨 4–6: 게임 진행.   레벨 7–9: 전략.
 *   레벨 10: AI와의 실전 테이블.
 */
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    title: '카드와 무늬',
    subtitle: '52장의 카드를 모두 알아보기',
    icon: '🂡',
    concept: [
      '표준 덱은 52장입니다: 무늬 4가지 × 랭크 13가지.',
      '무늬: 스페이드 ♠와 클럽 ♣는 검은색, 하트 ♥와 다이아몬드 ♦는 빨간색입니다.',
      '랭크는 2, 3, 4 … 10, 그다음 J, Q, K, A 순서입니다. 보통 에이스가 가장 높습니다.',
    ],
    lesson: cardsLesson,
    generate: generateCardDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 2,
    title: '족보',
    subtitle: '10가지 족보의 순위',
    icon: '🏆',
    concept: [
      '강한 순서: 로열 플러시, 스트레이트 플러시, 포카드, 풀하우스, 플러시, 스트레이트, 트리플, 투 페어, 원 페어, 하이 카드.',
      '높은 족보는 항상 낮은 족보를 이깁니다 — 플러시는 언제나 스트레이트를 이깁니다.',
      '핸드를 보자마자 이름을 말하고, 두 핸드를 비교하는 법을 익힙니다.',
    ],
    lesson: rankingsLesson,
    generate: generateRankingDrill,
    drillsPerSession: 12,
    masteryNeeded: 9,
  },
  {
    id: 3,
    title: '가장 좋은 핸드 만들기',
    subtitle: '7장 중 가장 좋은 5장',
    icon: '🃏',
    concept: [
      '나만 보는 홀 카드 2장을 받고, 커뮤니티 카드 5장은 모두가 함께 씁니다.',
      '내 핸드는 그 7장으로 만들 수 있는 가장 좋은 5장 조합입니다.',
      '홀 카드를 2장 다, 1장만, 또는 하나도 쓰지 않을 수도 있습니다("보드 플레이").',
    ],
    lesson: bestHandLesson,
    generate: generateBestHandDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 4,
    title: '테이블과 진행',
    subtitle: '버튼, 블라인드, 4번의 베팅 라운드',
    icon: '🎬',
    concept: [
      '딜러 버튼은 시계 방향으로 돌고, 버튼 왼쪽의 두 플레이어가 스몰 블라인드와 빅 블라인드를 냅니다.',
      '한 핸드는 프리플랍 → 플랍(3장) → 턴(1장) → 리버(1장) 순서로 진행되며, 매번 베팅이 있습니다.',
      '리버 후 두 명 이상 남아 있으면 쇼다운으로 승자를 정합니다.',
    ],
    lesson: tableFlowLesson,
    generate: generateTableFlowDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 5,
    title: '베팅 액션',
    subtitle: '체크, 벳, 콜, 레이즈, 폴드',
    icon: '💰',
    concept: [
      '체크 = 베팅 없이 넘기기, 벳 = 처음으로 칩 걸기, 콜 = 맞추기, 레이즈 = 올리기, 폴드 = 포기하기.',
      '체크는 내 앞에 벳이 없을 때만 할 수 있습니다.',
      '벳을 받으면 폴드, 콜, 레이즈 중에서 고릅니다 — 체크는 할 수 없습니다.',
    ],
    lesson: actionsLesson,
    generate: generateActionsDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 6,
    title: '포지션',
    subtitle: '나중에 행동하는 쪽이 유리한 이유',
    icon: '🎯',
    concept: [
      '포지션은 버튼을 기준으로 한 내 자리와, 그에 따른 행동 순서입니다.',
      '나중에 행동할수록 정보가 많습니다 — 버튼이 가장 좋은 자리, 언더더건이 가장 어려운 자리입니다.',
      '얼리 포지션에서는 타이트하게, 버튼에 가까워질수록 느슨하게 플레이하세요.',
    ],
    lesson: positionLesson,
    generate: generatePositionDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 7,
    title: '스타팅 핸드',
    subtitle: '어떤 카드 2장으로 플레이할까',
    icon: '🃏',
    concept: [
      '홀 카드 2장이 프리플랍 성패의 대부분을 정합니다 — 대부분의 핸드는 폴드하세요.',
      '등급: 프리미엄(AA–JJ, AK, AQ), 강함, 플레이 가능(작은 페어, 수티드 커넥터), 트래시.',
      '얼리 포지션에서는 타이트하게, 레이트 포지션에서는 플레이 가능 핸드를 더합니다.',
    ],
    lesson: startingHandsLesson,
    generate: generateStartingHandDrill,
    drillsPerSession: 12,
    masteryNeeded: 9,
  },
  {
    id: 8,
    title: '아웃츠와 팟 오즈',
    subtitle: '드로우의 수학',
    icon: '🧮',
    concept: [
      '아웃츠는 내 핸드를 완성해 주는 카드입니다 (플러시 드로우 = 9, 오픈엔디드 = 8, 거트샷 = 4).',
      '2와 4의 법칙: 에퀴티 ≈ 아웃츠 × 4 (카드 2장 남음) 또는 × 2 (카드 1장 남음).',
      '팟 오즈 = 콜 금액 ÷ (팟 + 콜 금액). 내 에퀴티가 이 비용보다 높을 때 콜하세요.',
    ],
    lesson: oddsLesson,
    generate: generateOddsDrill,
    drillsPerSession: 12,
    masteryNeeded: 9,
  },
  {
    id: 9,
    title: '보드 읽기',
    subtitle: '위협과 넛츠 찾기',
    icon: '🔍',
    concept: [
      '"넛츠"는 그 보드에서 가능한 가장 좋은 핸드입니다 — 무엇이 나를 이길 수 있는지 항상 따져 보세요.',
      '같은 무늬가 3장이면 플러시가 가능하고, 페어 보드에서는 풀하우스와 포카드가 가능합니다.',
      '칩을 걸기 전에 매 스트리트마다 스트레이트, 플러시, 페어를 살펴보세요.',
    ],
    lesson: boardLesson,
    generate: generateBoardDrill,
    drillsPerSession: 10,
    masteryNeeded: 8,
  },
  {
    id: 10,
    title: 'AI와 실전',
    subtitle: '실전 테이블에서 한 핸드 끝까지',
    icon: '♠️',
    concept: [
      '모든 것을 종합합니다: 봇 상대와 핸드를 끝까지 플레이합니다.',
      '포지션에 맞게 스타팅 핸드를 고르고, 보드를 읽고, 팟 오즈를 활용하세요.',
      '매 결정마다 코치가 이유와 함께 액션을 추천합니다.',
    ],
    lesson: tablePlayLesson,
    play: true,
  },
];

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}
