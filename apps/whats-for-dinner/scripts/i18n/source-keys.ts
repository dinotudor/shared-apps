import ts from "typescript";

/** The local names that `_` (or `localize`) from compiled-i18n has in this file. */
const localizeNames = (file: ts.SourceFile): Set<string> => {
  const names = new Set<string>();
  for (const statement of file.statements) {
    if (!ts.isImportDeclaration(statement)) continue;
    if (!ts.isStringLiteral(statement.moduleSpecifier)) continue;
    if (statement.moduleSpecifier.text !== "compiled-i18n") continue;
    const bindings = statement.importClause?.namedBindings;
    if (!bindings || !ts.isNamedImports(bindings)) continue;
    for (const element of bindings.elements) {
      const imported = (element.propertyName ?? element.name).text;
      if (imported === "_" || imported === "localize") names.add(element.name.text);
    }
  }
  return names;
};

/**
 * The key compiled-i18n builds from a template's text parts (its makeKey): a literal `$`
 * becomes `$$`, and each `${…}` becomes `$1`, `$2`, ….
 */
const makeKey = (parts: string[]): string =>
  parts
    .map((part, index) => `${index ? `$${String(index)}` : ""}${part.replaceAll("$", "$$$$")}`)
    .join("");

const templateParts = (template: ts.TemplateLiteral): string[] =>
  ts.isNoSubstitutionTemplateLiteral(template)
    ? [template.text]
    : [template.head.text, ...template.templateSpans.map((span) => span.literal.text)];

/**
 * The translation keys a source file uses, the same way the Vite plugin finds them: every
 * tagged template whose tag is `_` or `localize` imported from compiled-i18n.
 */
export const keysInSource = (code: string, fileName: string): Set<string> => {
  const file = ts.createSourceFile(
    fileName,
    code,
    ts.ScriptTarget.Latest,
    false,
    ts.ScriptKind.TSX,
  );
  const names = localizeNames(file);
  const keys = new Set<string>();
  if (names.size === 0) return keys;
  const visit = (node: ts.Node): void => {
    if (
      ts.isTaggedTemplateExpression(node) &&
      ts.isIdentifier(node.tag) &&
      names.has(node.tag.text)
    ) {
      keys.add(makeKey(templateParts(node.template)));
    }
    ts.forEachChild(node, visit);
  };
  visit(file);
  return keys;
};
