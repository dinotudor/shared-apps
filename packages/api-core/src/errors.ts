/** Every domain error code. Adding one makes trpc.ts map it to a tRPC code, or it won't compile. */
export type DomainErrorCode = "not_a_member";

/**
 * A business rule a call broke. Modules throw it from anywhere in a call; api-core turns it
 * into a tRPC error in one place (trpc.ts). `code` is stable: the frontends branch on it
 * (as `error.data.domainCode`), never on the message.
 */
export abstract class DomainError extends Error {
  abstract readonly code: DomainErrorCode;
}

/** The viewer is signed in but is not a member of the app (GLOSSARY: Member). */
export class NotAMemberError extends DomainError {
  override name = "NotAMemberError";
  readonly code = "not_a_member";
}
