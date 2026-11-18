# shared-apps

Small apps shared with a small group of people. They share one sign-in, one database and one design system.

## Language

**Collaborator**:
A person who uses one or more of the deployed apps. Not a GitHub repository collaborator.
_Avoid_: Customer, client

**App**:
One product used by collaborators, such as What's for dinner. Each app has its own frontend and its own membership list, and shares the backend.
_Avoid_: Project, site

**Member**:
A collaborator who may use a given app.
_Avoid_: Household, family (as a data concept)

**Allowlist**:
The emails that may sign in at all, set in `AUTH_ALLOWED_EMAILS`. Being on it doesn't make someone a member of any app.
_Avoid_: Whitelist

**Viewer**:
The signed-in collaborator a request is made for.
_Avoid_: Current user, me

**Role**:
What a signed-in collaborator may do across every app: `admin` or `member`. The role named `member` is not the same as being a **Member** of an app: a collaborator with the `member` role may still not be a Member of What's for dinner.
_Avoid_: Permission level
