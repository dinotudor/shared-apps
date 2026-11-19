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

### What's for dinner

**Dish**:
Something the family cooks for dinner, with its ingredients and instructions. Saved once and planned on as many days as the family likes.
_Avoid_: Recipe, meal (a meal is a planned dinner on a day)

**Ingredient**:
One item in a dish's ordered list, with a name and an optional free-text quantity such as "2 cups".
_Avoid_: Item, component

**Deleted dish**:
A dish someone deleted. It no longer appears in lists or when choosing a dish to plan, but past days that had it still show it.
_Avoid_: Archived dish, removed dish

**Times cooked**:
How many days before today had the dish planned for dinner.
_Avoid_: Times made, popularity
