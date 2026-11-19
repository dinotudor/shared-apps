/**
 * The collaborator apps that share this API. Each one has its own members (GLOSSARY: App,
 * Member). The value is stored in `membership.app_member.app_id`, so never rename one.
 */
export const App = { WhatsForDinner: "whats-for-dinner" } as const;
export type App = (typeof App)[keyof typeof App];
