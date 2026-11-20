// 실전 테이블에서 한 사람의 행동마다 보여 주는 해설.
// 봇의 카드는 모르는 상태에서, 테이블에 공개된 정보(행동, 금액, 자리, 보드)만으로
// "왜 이렇게 했을까"를 추측하고, 그 행동에서 내가 얻는 정보를 알려 줍니다.

import {
  type Action,
  type GameState,
  type Player,
  STREET_LABEL,
  actingOrder,
  legalActions,
  seatName,
} from './game';
import { type Difficulty } from './bot';
import { flushPossible, isPaired } from './board';
import { handLabel } from './handEvaluator';
import { Glosser } from './glossary';
import { josa } from './josa';
import { type CoachAdvice } from './coach';

export interface Narration {
  /** 제목, 예: "2번 민수: 레이즈 80". */
  title: string;
  kind: 'start' | 'bot' | 'me';
  sections: { title: string; lines: string[] }[];
}

const pct = (x: number) => Math.round(x * 100);

/** 행동 이름, 예: "콜 20", "레이즈 80". 스트리트가 넘어가도 정확하도록 낸 칩으로 계산합니다. */
export function actionLabel(prev: GameState, next: GameState, action: Action): string {
  const before = prev.players[prev.toAct];
  const after = next.players[before.id];
  const pay = after.totalCommitted - before.totalCommitted;
  const target = before.committed + pay;
  switch (action.type) {
    case 'fold':
      return '폴드';
    case 'check':
      return '체크';
    case 'call':
      return pay > 0 ? `콜 ${pay}` : '체크';
    default:
      if (after.allIn) return `올인 ${target}`;
      return `${prev.currentBet === 0 ? '벳' : '레이즈'} ${target}`;
  }
}

/** 새 핸드가 시작될 때의 해설: 버튼·블라인드·행동 순서. */
export function narrateHandStart(state: GameState): Narration {
  const g = new Glosser();
  const P = (i: number) => seatName(state.players[i]);
  const me = state.players.find((p) => p.isHuman)!;
  const order = actingOrder(state).map(P).join(' → ');
  const dealtIn = state.players.filter((p) => !p.sittingOut).length;
  const lines = [
    `${g.t('딜러 버튼')}: ${P(state.buttonIndex)}.`,
    `${P(state.sbIndex)}: ${g.t('스몰 블라인드')} ${state.players[state.sbIndex].totalCommitted}칩, ${P(state.bbIndex)}: ${g.t('빅 블라인드')} ${state.players[state.bbIndex].totalCommitted}칩을 냈습니다.`,
  ];
  if (dealtIn === 2) {
    lines.push(`두 명만 남은 ${g.t('헤즈업')}이라, 규칙에 따라 버튼이 스몰 블라인드를 내고 프리플랍에서 먼저 행동합니다.`);
  }
  lines.push(
    `${g.t('프리플랍')} 행동 순서: ${order}. 빅 블라인드 바로 다음 사람부터 시작해, 블라인드를 낸 사람이 마지막에 행동합니다.`,
  );
  if (!me.sittingOut) lines.push(`내 ${g.t('홀 카드')}: ${handLabel(me.hole)}.`);
  return { title: '새 핸드 시작', kind: 'start', sections: [{ title: '이번 핸드', lines }] };
}

const PROFILE_NOTE: Record<Difficulty, (g: Glosser) => string> = {
  easy: (g) =>
    `쉬움 봇은 ${g.t('루즈')}·${g.t('패시브')} 스타일입니다. 콜을 아주 많이 하고 레이즈는 드뭅니다. 그래서 이 봇이 레이즈하면 정말 강한 패일 가능성이 높고, 콜은 별 의미가 없습니다.`,
  normal: () =>
    '보통 봇은 균형형입니다. 강한 패면 레이즈를 꽤 하고, 가끔(약 5%) 약한 패로 블러프도 합니다.',
  hard: (g) =>
    `어려움 봇은 ${g.t('타이트')}·${g.t('어그레시브')} 스타일입니다. 약한 패는 잘 버리고 강한 패면 자주 레이즈하며, 블러프도 꽤(약 14%) 합니다. 레이즈가 늘 강한 패라는 뜻은 아닙니다.`,
};

/** 행동 뒤에 스트리트가 바뀌었거나 핸드가 끝났으면 알려 주는 줄. */
function streetChangeLines(prev: GameState, next: GameState, g: Glosser): string[] {
  if (next.street === prev.street) return [];
  if (next.street === 'complete') {
    return [next.outcome ? `핸드가 끝났습니다. ${next.outcome.summary}` : '핸드가 끝났습니다.'];
  }
  const newCards = next.board.slice(prev.board.length);
  return [
    `이번 베팅 라운드에서 모두 행동을 마쳐 ${g.t(STREET_LABEL[next.street], '으로/로')} 넘어갑니다. 새로 깔린 카드: ${handLabel(newCards)} (보드: ${handLabel(next.board)}).`,
    `플랍부터는 ${g.t('딜러 버튼')} 바로 왼쪽 사람부터 행동합니다: ${actingOrder(next)
      .filter((i) => !next.players[i].folded)
      .map((i) => seatName(next.players[i]))
      .join(' → ')}.`,
  ];
}

/** 이 행동 직후 사람 플레이어 입장에서 달라진 점. */
function myViewLines(prev: GameState, next: GameState, actor: Player, action: Action): string[] {
  const me = next.players.find((p) => p.isHuman)!;
  if (me.folded || me.sittingOut) return [];
  const lines: string[] = [];
  const stillIn = next.players.filter((p) => !p.folded && !p.isHuman);
  if (action.type === 'fold') {
    lines.push(`상대가 한 명 줄었습니다(남은 상대 ${stillIn.length}명). 상대가 적을수록 내가 이길 확률이 올라갑니다.`);
  }
  if (next.street === prev.street && next.street !== 'complete') {
    const toCall = Math.max(0, next.currentBet - me.committed);
    if ((action.type === 'raise' || action.type === 'allin') && toCall > 0) {
      lines.push(`이제 내가 이 핸드에 남으려면 ${toCall}칩을 더 내야 합니다. 팟은 ${next.pot}칩입니다.`);
    }
    if (next.toAct === me.id) lines.push('다음은 내 차례입니다.');
  }
  if (lines.length === 0 && actor.id !== me.id) {
    lines.push(`팟은 ${next.pot}칩입니다.`);
  }
  return lines;
}

/** 봇 한 명의 행동 해설. `prev`는 행동 직전, `next`는 행동 직후 상태입니다. */
export function narrateBotAction(
  prev: GameState,
  next: GameState,
  action: Action,
  difficulty: Difficulty,
): Narration {
  const g = new Glosser();
  const actor = prev.players[prev.toAct];
  const after = next.players[actor.id];
  const legal = legalActions(prev);
  const call = legal.callAmount;
  const pay = after.totalCommitted - actor.totalCommitted;
  const preflop = prev.board.length === 0;
  const street = g.t(STREET_LABEL[prev.street]);
  const potBefore = prev.pot;
  const title = `${seatName(actor)}: ${actionLabel(prev, next, action)}`;

  const what: string[] = [];
  const guess: string[] = [];

  switch (action.type) {
    case 'fold':
      what.push(
        `${street}에서 ${g.t('폴드', '을/를')} 했습니다. ${
          actor.totalCommitted > 0
            ? `이번 핸드에 이미 낸 ${actor.totalCommitted}칩은 팟에 남고, `
            : '칩을 하나도 내지 않았으니 잃은 것은 없고, '
        }${josa(seatName(actor), '은/는')} 더 이상 이 팟을 가질 수 없습니다.`,
      );
      guess.push(
        call > 0
          ? `계속하려면 ${call}칩(${g.t('팟 오즈')} ${pct(call / (potBefore + call))}%)을 내야 했는데, 그만한 가치가 있는 패가 아니었던 것으로 보입니다.`
          : '체크할 수 있었는데도 폴드한 것은 보통 실수입니다.',
      );
      if (preflop) guess.push(`프리플랍 폴드는 대부분 ${g.t('트래시 핸드')}에서 나옵니다.`);
      break;
    case 'check':
      what.push(`${street}에서 ${g.t('체크', '을/를')} 했습니다. 칩을 더 내지 않고 차례를 넘겼습니다.`);
      if (preflop && prev.bbIndex === actor.id) {
        guess.push(
          `${g.t('빅 블라인드')}라 이미 ${actor.committed}칩을 냈고 아무도 레이즈하지 않아서 공짜로 플랍을 봅니다. 아주 강한 패였다면 레이즈했을 가능성이 높으니, 보통은 평범한 패입니다.`,
        );
      } else {
        guess.push(
          `보통 약하거나 중간 정도의 패라는 신호입니다. 다만 아주 강한 패로 상대의 베팅을 유도하는 ${g.t('슬로우 플레이')}일 수도 있습니다.`,
        );
      }
      break;
    case 'call':
      what.push(
        `${street}에서 ${g.t('콜', '을/를')} 했습니다. 앞에서 건 금액에 맞춰 ${pay}칩을 냈습니다(팟 ${potBefore} → ${potBefore + pay}칩).`,
      );
      if (preflop) {
        guess.push(
          '플레이할 만한 패(작은 페어, 같은 무늬 카드, 높은 카드 등)일 가능성이 큽니다. 레이즈하지 않았으니 아주 강한 패는 아닐 수도 있습니다.',
        );
      } else {
        guess.push(
          `어느 정도 맞은 패(페어 등)이거나, 다음 카드를 기다리는 ${g.t('드로우')}일 수 있습니다. 레이즈하지 않았으니 아주 강하지는 않을 가능성이 조금 더 높습니다.`,
        );
        if (flushPossible(prev.board)) guess.push('보드에 같은 무늬가 많아서 플러시나 플러시 드로우일 수도 있습니다.');
      }
      break;
    case 'raise':
    case 'allin': {
      const isBet = prev.currentBet === 0;
      const term = action.type === 'allin' || after.allIn ? '올인' : isBet ? '벳' : '레이즈';
      const ratio = potBefore > 0 ? pay / potBefore : 0;
      what.push(
        `${street}에서 ${g.t(term, '을/를')} 했습니다. 이번 라운드에 총 ${actor.committed + pay}칩까지 올렸고(${pay}칩을 더 냄), 이는 원래 팟 ${potBefore}칩의 약 ${pct(ratio)}% 크기입니다.`,
      );
      if (term === '올인') {
        guess.push('올인은 가장 강한 신호입니다. 아주 강한 패이거나, 칩이 얼마 안 남아 승부를 건 것일 수 있습니다.');
      } else if (preflop) {
        guess.push(
          `프리플랍 레이즈는 보통 ${g.t('프리미엄 핸드')}나 ${g.t('강한 핸드')}에서 나옵니다(높은 페어, 에이스·킹 같은 높은 카드).`,
        );
      } else {
        guess.push(
          `보통 보드와 강하게 맞은 패(투 페어 이상 등)를 뜻합니다. 하지만 상대를 폴드시키려는 ${g.t('블러프')}일 수도 있습니다.`,
        );
        if (isPaired(prev.board)) guess.push('보드에 페어가 있어 트리플이나 풀하우스일 가능성도 있습니다.');
        if (flushPossible(prev.board)) guess.push('보드에 같은 무늬가 많아 플러시를 완성했을 수도 있습니다.');
      }
      if (ratio >= 1) guess.push('팟보다 큰 베팅은 매우 강한 패이거나 블러프인 경우가 많습니다.');
      break;
    }
  }

  guess.push(PROFILE_NOTE[difficulty](g));
  guess.push('(참고: 이 게임의 봇은 지금 완성된 족보와 스타팅 핸드 등급만 보고 판단하고, 자리나 드로우는 고려하지 않습니다.)');

  const sections = [
    { title: '무엇을 했나', lines: what },
    { title: '왜 그랬을까? (카드를 모르니 추측입니다)', lines: guess },
  ];
  const mine = [...myViewLines(prev, next, actor, action), ...streetChangeLines(prev, next, g)];
  if (mine.length) sections.push({ title: '내가 알게 된 것 / 다음', lines: mine });
  return { title, kind: 'bot', sections };
}

/** 사람 플레이어 행동 해설: 무엇을 했고 코치 추천과 같았는지. */
export function narrateMyAction(
  prev: GameState,
  next: GameState,
  action: Action,
  advice: CoachAdvice | null,
): Narration {
  const g = new Glosser();
  const me = prev.players[prev.toAct];
  const after = next.players[me.id];
  const title = `${seatName(me)}: ${actionLabel(prev, next, action)}`;
  const lines: string[] = [];
  if (advice) {
    const same =
      advice.action === action.type ||
      (advice.action === 'raise' && action.type === 'allin' && advice.raiseTo === after.committed);
    lines.push(
      same
        ? `✅ 코치 추천(${advice.label})과 같은 선택입니다.`
        : `코치 추천은 "${advice.label}"였습니다. 내 선택과 추천이 다른 이유를 위의 설명과 비교해 보세요.`,
    );
  }
  if (action.type === 'fold') {
    lines.push('폴드했으니 이번 핸드의 나머지는 빠르게 진행합니다.');
  }
  const sections = [{ title: '내 선택', lines }];
  const rest = streetChangeLines(prev, next, g);
  if (rest.length) sections.push({ title: '다음', lines: rest });
  return { title, kind: 'me', sections };
}
