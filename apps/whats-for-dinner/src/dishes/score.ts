/**
 * The emoji for a Score or a Family average (brief 3.2): 🤢 0–4, 😐 5–7, 😍 8–10. The bands
 * are whole scores, so an average takes the band of the nearest one, as the prototype
 * does: 7.5 rounds to 8 and gets 😍.
 */
export const scoreEmoji = (score: number): string => {
  if (score < 4.5) return "🤢";
  if (score < 7.5) return "😐";
  return "😍";
};
