import { describe, expect, it } from "vitest";
import { formatDate } from "../src/i18n/dates.ts";

// 01:30 UTC on 20 November is still the evening of the 19th in São Paulo (UTC−3).
const LATE_EVENING = new Date("2026-11-20T01:30:00Z");

describe("formatDate", () => {
  it("writes the day in Brazilian Portuguese, in the given time zone", () => {
    expect(formatDate(LATE_EVENING, { locale: "pt-BR", timeZone: "America/Sao_Paulo" })).toBe(
      "quinta-feira, 19 de novembro",
    );
  });

  it("writes the same moment in English", () => {
    expect(formatDate(LATE_EVENING, { locale: "en", timeZone: "America/Sao_Paulo" })).toBe(
      "Thursday, November 19",
    );
  });

  it("takes other Intl options, such as a short weekday", () => {
    expect(
      formatDate(
        LATE_EVENING,
        { locale: "pt-BR", timeZone: "America/Sao_Paulo" },
        { weekday: "short", day: "numeric" },
      ),
    ).toBe("qui., 19");
  });
});
