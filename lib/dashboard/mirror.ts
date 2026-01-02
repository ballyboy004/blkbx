// lib/dashboard/mirror.ts
import type { Profile } from "@/lib/profile/profile";

export type Mirror = {
  identityLine: string;
  strategyBullets: string[];
  patternBullets: {
    edge: string;
    friction: string;
    constraint: string;
    guardrail: string;
  };
  today: {
    focus: string;
    guardrail: string;
    suggestion: string;
    steps?: string[];
  };
};

function clampText(input: string, max = 160) {
  const s = (input || "").trim().replace(/\s+/g, " ");
  if (!s) return "—";
  if (s.length <= max) return s;
  return s.slice(0, max).trimEnd() + "…";
}

function firstSentence(input: string) {
  const s = (input || "").trim();
  if (!s) return "";
  const idx = s.search(/[.!?]\s/);
  return idx === -1 ? s : s.slice(0, idx + 1);
}

function splitToBullets(input: string, max = 3) {
  const s = (input || "").trim();
  if (!s) return [];
  return s
    .split(/[,;\n]/)
    .map((x) => x.trim())
    .filter(Boolean)
    .slice(0, max);
}

function hasAny(haystack: string, needles: string[]) {
  const s = (haystack || "").toLowerCase();
  return needles.some((n) => s.includes(n));
}

function extractTimeCap(constraints: string) {
  // super simple: looks for "2 hours", "2hrs", "90 minutes" etc.
  const s = (constraints || "").toLowerCase();
  const hours = s.match(/(\d+(\.\d+)?)\s*(hour|hours|hr|hrs)\b/);
  if (hours?.[1]) return `${hours[1]}h/day`;

  const mins = s.match(/(\d+)\s*(minute|minutes|min|mins)\b/);
  if (mins?.[1]) return `${mins[1]}m/day`;

  return "";
}

export function buildMirror(profile: Profile): Mirror {
  const context = profile.context ?? "";
  const goal = profile.primary_goal ?? "";
  const strengths = profile.strengths ?? "";
  const weaknesses = profile.weaknesses ?? "";
  const constraints = profile.constraints ?? "";
  const focus = profile.current_focus ?? "";

  // identity: first sentence of context (or fallback)
  const identityRaw = firstSentence(context) || context || goal || "—";
  const identityLine = clampText(identityRaw, 170);

  // strategy bullets (deterministic keyword triggers)
  const strategyBullets: string[] = [];

  const timeCap = extractTimeCap(constraints);
  if (timeCap) strategyBullets.push(`time cap: ${timeCap}`);

  if (hasAny(context, ["scarcity", "not overly present", "not be overly present", "low presence", "rarely post"])) {
    strategyBullets.push("presence strategy: scarce / intentional");
  }

  if (hasAny(context, ["monthly", "every month", "each month"])) {
    strategyBullets.push("release cadence: monthly");
  } else if (hasAny(context, ["weekly", "every week"])) {
    strategyBullets.push("release cadence: weekly");
  }

  if (hasAny(context, ["tiktok"])) strategyBullets.push("channel: tiktok");
  if (hasAny(context, ["instagram", "ig"])) strategyBullets.push("channel: instagram");

  // pattern bullets
  const edgeList = splitToBullets(strengths, 3);
  const frictionList = splitToBullets(weaknesses, 3);
  const constraintList = splitToBullets(constraints, 2);

  const edge = edgeList.length ? edgeList.join(" • ") : clampText(strengths, 120);
  const friction = frictionList.length ? frictionList.join(" • ") : clampText(weaknesses, 120);
  const constraint = constraintList.length ? constraintList.join(" • ") : clampText(constraints, 120);

  // guardrail derived from constraints
  let guardrail = "one primary move. keep it small.";
  if (hasAny(constraints, ["burn out", "burnout", "overwhelm", "overwhelmed"])) {
    guardrail = "guardrail: one output only. stop while it’s still clean.";
  } else if (timeCap) {
    guardrail = `guardrail: stay inside ${timeCap}. no overflow.`;
  }

  // today section (deterministic)
  const todayFocus = clampText(focus || goal || "—", 140);

  let todaySuggestion = "ship one small thing that supports the focus.";
  if (hasAny(constraints, ["burn out", "burnout"])) {
    todaySuggestion = "pick the easiest version. ship it. no second project.";
  } else if (timeCap) {
    todaySuggestion = `do a single deep-work block (${timeCap}).`;
  } else if (hasAny(weaknesses, ["outreach", "network", "dm"])) {
    todaySuggestion = "do one outreach touchpoint (one message).";
  }

  return {
    identityLine,
    strategyBullets,
    patternBullets: {
      edge: edge || "—",
      friction: friction || "—",
      constraint: constraint || "—",
      guardrail,
    },
    today: {
      focus: todayFocus,
      guardrail,
      suggestion: todaySuggestion,
      steps: [],
    },
  };
}