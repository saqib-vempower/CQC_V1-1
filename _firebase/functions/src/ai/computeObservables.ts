// _firebase/functions/src/ai/computeObservables.ts
type Word = { text: string; confidence?: number };
type Utterance = {
  speaker?: string; // "A" agent, "B" student
  start?: number; // ms
  end?: number; // ms
  text?: string;
  words?: Word[];
};

const SIGNPOST_PATTERNS = [
  /one (moment|sec|second)/i,
  /hold on/i,
  /let me (just )?check/i,
  /give me a (second|moment)/i,
  /pull(ing)? that up/i,
  /thanks for waiting/i,
  /i'?ll (quickly|just)/i,
  /checking/i,
];

export function computeObservables(utterances: Utterance[]) {
  // Basic timeline
  const sorted = [...utterances].sort((a, b) => (a.start ?? 0) - (b.start ?? 0));
  const firstStart = sorted[0]?.start ?? 0;
  const lastEnd = sorted.length ? (sorted[sorted.length - 1].end ?? firstStart) : firstStart;
  const totalDurationSec = Math.max(0, (lastEnd - firstStart) / 1000);

  // Gaps for C4
  let maxGapSec = 0;
  let gapsOver4s = 0;
  for (let i=1; i<sorted.length; i++) {
    const prevEnd = sorted[i-1].end ?? 0;
    const curStart = sorted[i].start ?? prevEnd;
    const gapSec = Math.max(0, (curStart - prevEnd) / 1000);
    if (gapSec > maxGapSec) maxGapSec = gapSec;
    if (gapSec >= 4) gapsOver4s++;
  }

  // Text + word stats
  const fullText = (utterances.map((u) => u.text || "").join(" ")).slice(0, 20000);
  const totalWords = fullText.trim().split(/\s+/).filter(Boolean).length;
  const signpostPresent = SIGNPOST_PATTERNS.some((re) => re.test(fullText));

  // Per-speaker talk time (approx by sum of utterance spans)
  const agentUtterances = sorted.filter((u) => (u.speaker ?? "").toUpperCase() === "A");
  const callerUtterances = sorted.filter((u) => (u.speaker ?? "").toUpperCase() === "B");
  const sumSpan = (arr: Utterance[]) =>
    arr.reduce((s, u) => s + Math.max(0, ((u.end ?? 0) - (u.start ?? 0)) / 1000), 0);

  const agentTalkSec = sumSpan(agentUtterances);
  const callerTalkSec = sumSpan(callerUtterances);

  // C9 proxy (agent-side ASR confidence + inaudibles)
  const agentWords: Word[] = agentUtterances.flatMap((u) => u.words ?? []);
  const confidences = agentWords.map((w) => (typeof w.confidence === "number" ? w.confidence : 1));
  const agentMeanConf = confidences.length ?
    confidences.reduce((a, b)=>a+b, 0)/confidences.length :
    1;
  const agentLowConfShare = confidences.length ?
    confidences.filter((c) => c < 0.80).length / confidences.length :
    0;
  const inaudibleCount =
    (fullText.match(/\[(?:inaudible|unintelligible)\]/gi) || []).length;

  return {
    call: {totalDurationSec, totalWords, agentTalkSec, callerTalkSec},
    c4: {maxGapSec, gapsOver4s, signpostPresent},
    c9: {agentMeanConf, agentLowConfShare, inaudibleCount},
  };
}
