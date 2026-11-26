/**
 * What sort of problem a domain error is, for the caller. api-core maps each kind to a tRPC
 * code (trpc.ts), so modules declare errors without editing api-core (docs/adr/0010).
 */
export const DomainErrorKind = {
  /** The thing the call names doesn't exist, or the viewer may not see it. */
  NotFound: "not_found",
  /** The call breaks a business rule. Not malformed input: Zod rejects that first. */
  RuleViolated: "rule_violated",
  /** The viewer may not do this. */
  Forbidden: "forbidden",
} as const;
export type DomainErrorKind = (typeof DomainErrorKind)[keyof typeof DomainErrorKind];

/**
 * A business rule a call broke. Modules throw it from anywhere in a call; api-core turns it
 * into a tRPC error in one place (trpc.ts), by its `kind`. `code` is stable and owned by the
 * module that declares the error: the frontends branch on it (as `error.data.domainCode`),
 * never on the message. Name it after what is involved (`dish_not_found`, not `not_found`),
 * so codes stay unique across modules.
 */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly kind: DomainErrorKind;
}

/** The viewer is signed in but is not a member of the app (GLOSSARY: Member). */
export class NotAMemberError extends DomainError {
  override name = "NotAMemberError";
  readonly code = "not_a_member";
  readonly kind = DomainErrorKind.Forbidden;
}
