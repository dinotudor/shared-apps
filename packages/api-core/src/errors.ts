/**
 * A business rule a call broke. `code` is stable: the frontends branch on it (it reaches
 * them as `error.data.domainCode`), never on the message.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
}

/** The viewer is signed in but is not a member of the app (GLOSSARY: Member). */
export class NotAMemberError extends DomainError {
  override name = "NotAMemberError";
  readonly code = "not_a_member";
}
