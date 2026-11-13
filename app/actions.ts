"use server";

import { createHash } from "crypto";
import { supabaseAdmin } from "@/lib/supabase-server";

const EXPECTED_COUNT = 10;

export type SubmitResult =
  | { ok: true }
  | { ok: false; duplicate?: boolean; error: string };

export async function submitSurvey(payload: {
  token: string;
  answers: (number | null)[];
  otherText: string[];
}): Promise<SubmitResult> {
  if (
    !payload.token ||
    typeof payload.token !== "string" ||
    payload.token.length < 8
  ) {
    return { ok: false, error: "Invalid token." };
  }

  if (
    !Array.isArray(payload.answers) ||
    payload.answers.length !== EXPECTED_COUNT
  ) {
    return { ok: false, error: "Incomplete submission." };
  }
  if (payload.answers.some((a) => a === null || !Number.isInteger(a) || a < 0)) {
    return { ok: false, error: "Please answer every question." };
  }

  const tokenHash = createHash("sha256").update(payload.token).digest("hex");

  const claim = await supabaseAdmin
    .from("participation_tokens")
    .insert({ token_hash: tokenHash });

  if (claim.error) {
    if (claim.error.code === "23505") {
      return {
        ok: false,
        duplicate: true,
        error:
          "You have already participated in this survey. Each student can submit once. Thank you!",
      };
    }
    console.error("Token claim failed:", claim.error);
    return { ok: false, error: "Submission failed. Please try again." };
  }

  const insert = await supabaseAdmin.from("survey_responses").insert({
    answers: {
      answers: payload.answers,
      other: payload.otherText,
    },
  });

  if (insert.error) {
    console.error("Response insert failed:", insert.error);
    return { ok: false, error: "Submission failed. Please try again." };
  }

  return { ok: true };
}