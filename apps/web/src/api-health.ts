// Shared by the server loader and the page, so it lives outside src/server/.
export const ApiHealth = { Ok: "ok", Unreachable: "unreachable" } as const;
export type ApiHealth = (typeof ApiHealth)[keyof typeof ApiHealth];
