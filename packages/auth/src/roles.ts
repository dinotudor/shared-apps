export const Role = { Admin: "admin", Member: "member" } as const;
export type Role = (typeof Role)[keyof typeof Role];

/** The signed-in person behind a request. */
export type Viewer = { id: string; name: string; role: Role };

/** Anything unknown in the column counts as the least privileged role. */
export const parseRole = (value: unknown): Role =>
  value === Role.Admin ? Role.Admin : Role.Member;
