/**
 * The emoji for a score from 0 to 10 (brief 3.2): 🤢 0–4, 😐 5–7, 😍 8–10. An average
 * between bands, such as 4.9, takes the lower one: the bands start at 5 and 8.
 */
export const scoreEmoji = (score: number): string => {
  if (score < 5) return "🤢";
  if (score < 8) return "😐";
  return "😍";
};
