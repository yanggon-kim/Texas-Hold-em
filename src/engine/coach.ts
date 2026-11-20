// 실전 테이블의 코치: 지금 내 패, 자리, 이길 확률, 돈 계산, 선택지별 장단점을
// 하나씩 풀어 설명하고 추천 액션과 그 이유를 알려 줍니다.

import { type ActionType, type GameState, STREET_LABEL, legalActions, playersActingAfterPostflop, seatName } from './game';
import { classifyStartingHand, type Tier } from './startingHands';
import { evaluateHand, CATEGORY_NAME, handLabel } from './handEvaluator';
import { flushPossible, isPaired } from './board';
import { type EquityResult, type OpponentRange, estimateEquity, findOuts, improveOdds } from './equity';
import { Glosser } from './glossary';
import { josa } from './josa';

export interface CoachSection {
  title: string;
  lines: string[];
}

export interface CoachAdvice {
  action: ActionType;
  /** 버튼에 쓰는 이름, 예: "콜 20", "레이즈 80". */
  label: string;
  /** 'raise'·'allin' 추천일 때 목표 금액. */
  raiseTo?: number;
  /** 한 줄 요약. */
  headline: string;
  sections: CoachSection[];
  equity: EquityResult;
}

export const TIER_TERM: Record<Tier, string> = {
  premium: '프리미엄 핸드',
  strong: '강한 핸드',
  playable: '플레이 가능 핸드',
  trash: '트래시 핸드',
};

const TIER_WHY: Record<Tier, string> = {
  premium: '카드 2장만으로 이미 다른 대부분의 패보다 앞서 있습니다.',
  strong: '대부분의 상대 패보다 앞서지만, 큰 레이즈를 받으면 조심해야 합니다.',
  playable:
    '그 자체로는 약하지만 보드와 맞으면(트리플, 스트레이트, 플러시 등) 크게 이길 수 있는 패입니다. 싸게 들어갈 수 있을 때 가치가 있습니다.',
  trash:
    '높은 카드도 아니고 두 장이 서로 연결되거나 같은 무늬도 아니어서, 보드와 맞아도 더 좋은 패에 지기 쉽습니다.',
};

const pct = (x: number) => Math.round(x * 100);

/** 기본 벳·레이즈 크기: 지금 베팅 + 팟의 약 60%, 합법 범위 안. */
export function suggestedRaiseTo(state: GameState): number {
  const legal = legalActions(state);
  const target = state.currentBet + Math.max(state.bigBlind, Math.round(state.pot * 0.6));
  return Math.max(legal.minRaiseTo, Math.min(legal.maxRaiseTo, target));
}

/** 사람 플레이어(현재 행동할 사람)를 위한 자세한 코치 설명. */
export function coachAdvice(
  state: GameState,
  rng: () => number = Math.random,
  precomputed?: EquityResult,
): CoachAdvice {
  const g = new Glosser();
  const me = state.players[state.toAct];
  const legal = legalActions(state);
  const preflop = state.board.length === 0;
  const street = STREET_LABEL[state.street];
  const opponents = state.players.filter((p) => p !== me && !p.folded);
  const ranges: OpponentRange[] = opponents.map((p) => (p.raises > 0 ? 'noTrash' : 'any'));
  const equity = precomputed ?? estimateEquity(me.hole, state.board, ranges, rng);
  const eq = equity.equity;
  const nOpp = opponents.length;
  const fair = 1 / (nOpp + 1);
  const call = legal.callAmount;
  const potOdds = call > 0 ? call / (state.pot + call) : 0;
  const ev = Math.round(eq * (state.pot + call) - call);
  const raiseTo = suggestedRaiseTo(state);
  const raiseIsAllIn = raiseTo >= legal.maxRaiseTo;
  const betWord = state.currentBet > 0 ? '레이즈' : '벳';
  const sections: CoachSection[] = [];

  // ① 지금 내 패
  const hand = classifyStartingHand(me.hole[0], me.hole[1]);
  const handLines: string[] = [];
  handLines.push(
    `내 ${g.t('홀 카드')}: ${handLabel(me.hole)} → "${hand.name}"이고, 등급은 ${g.t(TIER_TERM[hand.tier])}입니다. ${TIER_WHY[hand.tier]}`,
  );
  if (!hand.pair) {
    handLines.push(
      hand.suited
        ? `두 장이 ${g.t('수티드')}라 같은 무늬 3장이 더 나오면 플러시가 됩니다.`
        : `두 장이 ${g.t('오프수트')}라 플러시가 되기는 어렵습니다.`,
    );
  }
  let outs = findOuts(me.hole, state.board);
  if (!preflop) {
    const made = evaluateHand([...me.hole, ...state.board]);
    handLines.push(
      `${g.t('보드')}: ${handLabel(state.board)}. 지금 내 7장 중 가장 좋은 5장은 ${handLabel(made.bestFive)} → ${made.name}입니다.`,
    );
    if (state.board.length >= 5) {
      const boardOnly = evaluateHand(state.board);
      if (boardOnly.category === made.category) {
        handLines.push(
          `주의: 이 ${josa(made.name, '은/는')} 보드에 이미 깔려 있는 것이라 모두가 함께 가집니다. 내 카드가 도움이 되지 않으면 ${g.t('킥커')} 싸움이나 무승부가 됩니다.`,
        );
      }
    }
    if (flushPossible(state.board)) {
      handLines.push('보드에 같은 무늬가 3장 이상 있어 누군가 플러시를 가졌을 수 있습니다.');
    }
    if (isPaired(state.board)) {
      handLines.push('보드에 같은 숫자가 두 장 있어(페어 보드) 누군가 풀하우스나 포카드를 가졌을 수 있습니다.');
    }
    if (state.board.length < 5) {
      if (outs.total > 0) {
        const parts = outs.byCategory.map((o) => `${josa(CATEGORY_NAME[o.category], '이/가')} 되는 카드 ${o.count}장`);
        const toCome = state.board.length === 3 ? 2 : 1;
        const rule = Math.min(100, outs.total * (toCome === 2 ? 4 : 2));
        handLines.push(
          `${g.t('아웃츠')}: ${outs.total}장 (${parts.join(', ')}). 남은 카드가 ${toCome}장이므로 "2와 4의 법칙"으로 어림하면 ${outs.total} × ${toCome === 2 ? 4 : 2}% ≈ ${rule}% 확률로 좋아집니다.`,
        );
      } else {
        handLines.push('다음 카드로 내 족보가 더 좋아질 카드(아웃츠)가 거의 없습니다.');
      }
      const better = improveOdds(me.hole, state.board);
      handLines.push(
        `정확히 세어 보면 ${g.t('리버')}까지 내 카드 덕분에 지금보다 높은 족보가 될 확률은 ${pct(better)}%입니다 (보드에만 생기는 페어처럼 모두가 함께 갖는 족보는 뺐습니다).`,
      );
    } else {
      outs = { ...outs, total: 0, byCategory: [] };
      handLines.push('리버까지 모든 카드가 나왔습니다. 이제 패는 더 바뀌지 않으니, 지금 패가 얼마나 강한지만 따지면 됩니다.');
    }
  }
  sections.push({ title: '① 지금 내 패', lines: handLines });

  // ② 내 자리(포지션)
  const posLines: string[] = [];
  const roles: string[] = [];
  if (state.buttonIndex === me.id) roles.push(g.t('딜러 버튼'));
  if (state.sbIndex === me.id) roles.push(g.t('스몰 블라인드'));
  if (state.bbIndex === me.id) roles.push(g.t('빅 블라인드'));
  posLines.push(`나는 ${me.id + 1}번 자리${roles.length ? `이고, ${roles.join(' + ')} 자리입니다` : '입니다'}.`);
  const after = playersActingAfterPostflop(state, me.id);
  const late = after <= 1;
  posLines.push(
    after === 0
      ? `${g.t('플랍')} 이후에는 내가 가장 마지막에 행동합니다. 남들이 어떻게 하는지 다 보고 결정할 수 있는 가장 좋은 ${g.t('포지션')}입니다.`
      : `플랍 이후에는 내 뒤에 아직 ${after}명이 행동합니다. ${
          late
            ? `4명 테이블에서는 뒤에 1명뿐이면 꽤 늦은 자리(${g.t('레이트 포지션')})입니다.`
            : `내가 먼저 행동해야 해서 정보가 적은 ${g.t('얼리 포지션')}입니다. 뒤에서 레이즈가 나오면 더 비싸질 수 있습니다.`
        }`,
  );
  sections.push({ title: '② 내 자리', lines: posLines });

  // ③ 이길 확률
  const raisers = opponents.filter((p) => p.raises > 0);
  const eqLines = [
    `지금 내 ${g.t('에퀴티')}는 약 ${pct(eq)}%입니다 (이길 확률 ${pct(equity.win)}%, 비길 확률 ${pct(equity.tie)}%).`,
    `계산 방법: 남은 상대 ${nOpp}명의 카드와 아직 안 나온 ${g.t('커뮤니티 카드')}를 ${equity.iterations.toLocaleString()}번 무작위로 깔아 보고 내가 이긴 비율을 셌습니다.${
      raisers.length
        ? ` 이번 핸드에서 ${g.t('벳')}이나 ${g.t('레이즈', '을/를')} 한 ${josa(raisers.map(seatName).join(', '), '은/는')} ${g.t('트래시 핸드', '을/를')} 들고 있지 않다고 가정했습니다.`
        : ''
    }`,
    `상대가 ${nOpp}명이면 모두의 실력이 같을 때 내 몫은 평균 ${pct(fair)}%입니다. ${
      Math.abs(eq - fair) < 0.03
        ? '지금은 평균과 비슷합니다.'
        : eq > fair
          ? '지금은 그보다 높아 평균보다 좋은 상황입니다.'
          : '지금은 그보다 낮아 평균보다 불리한 상황입니다.'
    }`,
  ];
  sections.push({ title: '③ 이길 확률', lines: eqLines });

  // ④ 돈 계산
  const moneyLines = [
    `지금 ${g.t('팟')}: ${state.pot}칩. 내 ${g.t('스택')}: ${me.chips}칩. 이번 핸드에 이미 낸 칩: ${me.totalCommitted}칩.`,
  ];
  if (call > 0) {
    moneyLines.push(
      `${g.t('콜', '을/를')} 하려면 ${call}칩을 내야 합니다. ${g.t('팟 오즈')} = ${call} ÷ (${state.pot} + ${call}) = ${pct(potOdds)}%. 내 승률이 ${pct(potOdds)}%보다 높으면 콜이 장기적으로 이득입니다.`,
      `콜의 ${g.t('기대값')} ≈ 승률 ${pct(eq)}% × 콜한 뒤 팟 ${state.pot + call}칩 − 콜 비용 ${call}칩 = ${ev >= 0 ? '+' : ''}${ev}칩 (앞으로 더 나올 베팅은 빼고 계산한 대략값).`,
    );
  } else {
    moneyLines.push(`앞에서 아무도 칩을 더 걸지 않아서 공짜로 ${g.t('체크')}할 수 있습니다.`);
  }
  if (me.totalCommitted > 0) {
    moneyLines.push(
      `이미 낸 ${me.totalCommitted}칩은 폴드해도 돌려받지 못하고, 이기면 팟과 함께 돌아옵니다. 그러니 "이미 낸 돈이 아깝다"는 생각은 버리고, 앞으로 낼 돈과 얻을 수 있는 돈만 비교하세요.`,
    );
  }
  sections.push({ title: '④ 돈 계산', lines: moneyLines });

  // ⑤ 선택지별로 따져 보기
  const optLines: string[] = [];
  optLines.push(
    legal.canCheck
      ? `${g.t('폴드')}: 공짜로 체크할 수 있는데 폴드하면 이길 기회만 버리는 것이라 의미가 없습니다.`
      : `${g.t('폴드')}: 더 잃지는 않지만, 팟 ${state.pot}칩을 가질 기회를 포기합니다.`,
  );
  if (legal.canCheck) {
    optLines.push(`체크: 칩을 내지 않고 다음으로 넘어갑니다. 뒤 사람이 베팅하면 그때 다시 결정하면 됩니다.`);
  } else {
    optLines.push(
      `콜 ${call}: 승률 ${pct(eq)}% ${eq >= potOdds ? '≥' : '<'} 팟 오즈 ${pct(potOdds)}% → 숫자로는 ${eq >= potOdds ? '이득' : '손해'}인 콜입니다.`,
    );
  }
  if (legal.canRaise && !raiseIsAllIn) {
    const pay = raiseTo - me.committed;
    const potAfter = state.pot + pay;
    const oppCall = raiseTo - state.currentBet > 0 && state.currentBet > 0 ? raiseTo - state.currentBet : raiseTo;
    const oppOdds = oppCall / (potAfter + oppCall);
    optLines.push(
      `${g.t(betWord)} ${raiseTo}: 지금 베팅 ${state.currentBet}칩 + 팟의 약 60%(${Math.max(state.bigBlind, Math.round(state.pot * 0.6))}칩)로 정한 크기입니다. 그러면 상대는 따라오려고 ${oppCall}칩을 더 내야 해서, 상대의 팟 오즈는 ${pct(oppOdds)}%가 됩니다. 플러시 ${g.t('드로우')}가 다음 한 장에 완성될 확률은 약 20%라, 이 가격이면 드로우로 따라오는 상대는 손해를 봅니다. 너무 작게 걸면 상대가 싸게 따라오고, 너무 크게 걸면 약한 패는 다 폴드해 버려 받을 돈이 줄어듭니다.`,
    );
  }
  if (legal.canRaise) {
    optLines.push(
      `${g.t('올인')} ${legal.maxRaiseTo}: 가진 칩을 전부 겁니다. 지면 한 번에 크게 잃으니, 보통 아주 강하거나 칩이 얼마 안 남았을 때만 씁니다.`,
    );
  }
  sections.push({ title: '⑤ 선택지별로 따져 보기', lines: optLines });

  // ⑥ 추천
  let action: ActionType;
  const why: string[] = [];
  const raiseAction = (): ActionType => (raiseIsAllIn ? 'allin' : 'raise');

  if (preflop) {
    const raisedPot = state.currentBet > state.bigBlind;
    why.push(
      `${g.t('프리플랍')}에서는 팟 오즈 계산만으로 결정하기 어렵습니다. 앞으로 베팅 라운드가 3번 더 남아 있고, 승률도 상대가 어떤 패로 들어왔는지에 크게 좌우되기 때문입니다. 그래서 레벨 7의 스타팅 핸드 등급과 내 자리를 기준으로 판단합니다.`,
    );
    if (hand.tier === 'premium' && legal.canRaise) {
      action = raiseAction();
      why.push(
        `${TIER_TERM.premium}입니다. 이기고 있을 가능성이 높을 때는 팟을 키울수록 이득입니다. 레이즈하면 약한 패들이 폴드해 상대 수가 줄어서 이길 확률도 더 올라갑니다.`,
      );
    } else if (hand.tier === 'strong' || hand.tier === 'premium') {
      if (!raisedPot && legal.canRaise) {
        action = raiseAction();
        why.push(`${TIER_TERM.strong}이고 아직 아무도 레이즈하지 않았습니다. 먼저 레이즈해서 팟을 키우고 주도권을 잡는 것이 좋습니다.`);
      } else if (legal.canCheck) {
        action = 'check';
        why.push('강한 패지만 공짜로 다음 카드를 볼 수 있으니 체크합니다.');
      } else {
        action = 'call';
        why.push('강한 패지만 누군가 이미 레이즈해서 상대도 강할 수 있습니다. 다시 올리기보다 콜해서 플랍을 보고 판단합니다.');
      }
    } else if (hand.tier === 'playable') {
      if (legal.canCheck) {
        action = 'check';
        why.push('공짜로 플랍을 볼 수 있으니 체크합니다. 플랍에서 맞으면 그때 적극적으로 플레이하면 됩니다.');
      } else if (late && !raisedPot) {
        action = 'call';
        why.push(
          `${TIER_TERM.playable}는 늦게 행동하는 자리에서 싸게 들어갈 때 가치가 있습니다. 지금은 빅 블라인드만큼만 내면 되니 콜로 플랍을 봅니다. 맞으면 크게 이기고, 안 맞으면 플랍에서 쉽게 버릴 수 있습니다.`,
        );
      } else {
        action = 'fold';
        why.push(
          raisedPot
            ? '누군가 이미 레이즈해서 플랍을 보는 값이 비싸졌습니다. 이 정도 패로는 비싼 값을 치를 가치가 없습니다.'
            : '내가 일찍 행동하는 자리라 뒤에서 레이즈가 나오면 더 비싸지거나, 불리한 자리에서 계속 먼저 행동해야 합니다. 이 정도 패는 늦은 자리에서만 플레이합니다.',
        );
      }
    } else {
      if (legal.canCheck) {
        action = 'check';
        why.push(`약한 패지만 이미 ${g.t('빅 블라인드')}로 낸 칩만으로 공짜로 플랍을 볼 수 있으니 체크합니다.`);
      } else {
        action = 'fold';
        why.push(
          `${TIER_TERM.trash}입니다. 콜해서 플랍을 봐도 맞을 확률이 낮고, 맞아도 더 좋은 패에 지기 쉽습니다. 돈을 내야 한다면 버리는 것이 장기적으로 칩을 아끼는 길입니다.`,
        );
      }
    }
  } else {
    const strongTh = Math.min(0.65, fair * 1.5 + 0.05);
    if (call > 0) {
      if (eq >= strongTh && legal.canRaise) {
        action = raiseAction();
        why.push(
          `승률 ${pct(eq)}%는 상대 ${nOpp}명 기준으로 꽤 높습니다(기준 ${pct(strongTh)}%). 이기고 있을 가능성이 높을 때 상대가 더 많이 내게 만드는 것이 ${g.t('밸류 벳')}의 핵심입니다. 콜만 하면 받을 수 있는 돈을 놓치고, 드로우를 가진 상대에게 싼 가격을 주게 됩니다.`,
        );
      } else if (eq >= potOdds) {
        action = 'call';
        why.push(
          `승률 ${pct(eq)}%가 팟 오즈 ${pct(potOdds)}%보다 높으니 콜이 장기적으로 이득입니다(기대값 ${ev >= 0 ? '+' : ''}${ev}칩). 하지만 이기고 있다고 확신할 만큼 높지는 않아서(레이즈 기준 ${pct(strongTh)}%) 레이즈까지는 하지 않습니다.`,
        );
      } else {
        action = 'fold';
        why.push(
          `승률 ${pct(eq)}%가 팟 오즈 ${pct(potOdds)}%보다 낮습니다. 이 콜을 100번 반복하면 평균적으로 한 번에 ${Math.abs(ev)}칩씩 잃는 셈이라 폴드가 맞습니다. 이미 낸 칩이 아까워도, 앞으로 잃을 돈을 막는 것이 더 중요합니다.`,
        );
      }
    } else if (eq >= strongTh && legal.canRaise) {
      action = raiseAction();
      why.push(
        `승률 ${pct(eq)}%로 앞서 있을 가능성이 높습니다(기준 ${pct(strongTh)}%). ${g.t('밸류 벳')}을 해서 나보다 약한 패를 가진 상대가 콜할 때 칩을 더 받아 냅니다. 체크하면 상대에게 다음 카드를 공짜로 보여 줘서 역전당할 기회를 주게 됩니다.`,
      );
    } else {
      action = 'check';
      if (eq >= fair) {
        why.push(
          `중간 세기의 패입니다(승률 ${pct(eq)}%, 평균 ${pct(fair)}%보다는 높지만 기준 ${pct(strongTh)}%보다는 낮음). 이런 패로 베팅하면 나보다 약한 패는 폴드하고, 나보다 강한 패만 콜하거나 레이즈합니다. 결국 이길 때는 더 벌지 못하고 질 때만 더 잃게 됩니다.`,
          `그래서 체크로 "팟을 작게 유지"합니다. 팟이 작으면 지고 있을 때 잃는 돈이 적고, 다음 카드를 공짜로 볼 수 있습니다. 나중에 확실히 좋아지면 그때 키우면 됩니다.`,
        );
      } else {
        why.push(
          `승률 ${pct(eq)}%로 평균(${pct(fair)}%)보다 약합니다. 지금 베팅하면 ${g.t('블러프')}가 되는데, 상대가 ${nOpp}명이면 모두가 폴드할 가능성은 낮습니다. 공짜로 다음 카드를 보는 체크가 가장 좋습니다.`,
        );
      }
    }
  }

  const label =
    action === 'fold'
      ? '폴드'
      : action === 'check'
        ? '체크'
        : action === 'call'
          ? `콜 ${call}`
          : action === 'allin'
            ? `올인 ${legal.maxRaiseTo}`
            : `${betWord} ${raiseTo}`;
  sections.push({ title: `⑥ 그래서 추천: ${label}`, lines: why });

  return {
    action,
    label,
    raiseTo: action === 'raise' ? raiseTo : action === 'allin' ? legal.maxRaiseTo : undefined,
    headline: `${street} · 승률 약 ${pct(eq)}%${call > 0 ? ` · 팟 오즈 ${pct(potOdds)}%` : ''} → 추천: ${label}`,
    sections,
    equity,
  };
}
