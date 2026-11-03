import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const root = path.resolve(import.meta.dirname, "..");
const walk = (directory: string): string[] => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const target = path.join(directory, entry.name);
  return entry.isDirectory() ? walk(target) : [target];
});
const files = walk(path.join(root, "src"));
const issues: string[] = [];
let effects = 0;
let components = 0;
let routeParameters = 0;
let reducers = 0;
for (const file of files) {
  const relative = path.relative(root, file).replaceAll("\\", "/");
  if (!/\.tsx?$/.test(file)) {
    issues.push(`${relative}: src/ deve conter somente arquivos .ts/.tsx.`);
    continue;
  }
  if (relative.startsWith("src/components/") && relative.endsWith(".tsx")) components++;
  const source = ts.createSourceFile(file, fs.readFileSync(file, "utf8"), ts.ScriptTarget.Latest, true, file.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const report = (node: ts.Node, message: string): void => {
    const line = source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
    issues.push(`${relative}:${line}: ${message}`);
  };
  const ui = /^src\/(components|pages)\//.test(relative);
  const visit = (node: ts.Node): void => {
    if (node.kind === ts.SyntaxKind.AnyKeyword) report(node, "any não permitido.");
    if (ui && ts.isImportDeclaration(node) && ts.isStringLiteral(node.moduleSpecifier)) {
      const module = node.moduleSpecifier.text;
      if (module.startsWith("@/services/") && !node.importClause?.isTypeOnly) report(node, "UI deve consumir hooks; import de serviço não permitido.");
      if (module === "@/lib/auth-token") report(node, "UI deve consumir o AuthContext, não o store interno.");
    }
    if (ts.isJsxAttribute(node) && node.name.getText(source) === "dangerouslySetInnerHTML") report(node, "HTML bruto não permitido.");
    if (ts.isCallExpression(node)) {
      const name = node.expression.getText(source).split(".").at(-1);
      if (name === "useParams") routeParameters++;
      if (name === "useReducer") reducers++;
      if (name === "useEffect" || name === "useLayoutEffect") {
        effects++;
        if (node.arguments.length !== 2 || !ts.isArrayLiteralExpression(node.arguments[1])) report(node, "Efeito deve declarar um array de dependências explícito.");
      }
      if (ui && name === "fetch") report(node, "HTTP não permitido na UI.");
      if (ui && /^(?:api|axios)\.(?:get|post|put|patch|delete|request)$/.test(node.expression.getText(source))) report(node, "HTTP não permitido na UI.");
      if (name === "alert" && !node.expression.getText(source).includes(".")) report(node, "Use feedback no DOM em vez de alert().");
    }
    if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken && /^(?:window\.)?location\.href$/.test(node.left.getText(source))) report(node, "Use navegação do React Router.");
    if (/src\/components\/(?:reports\/ReportCard|ProductFdsReview|DataGrid|DataTable|ProductsResults)\b/.test(relative)
      && ts.isJsxAttribute(node) && node.name.getText(source) === "key" && node.initializer && /^\{(?:index|idx|rowIndex)\}$/.test(node.initializer.getText(source))) report(node, "Lista dinâmica exige chave de identidade do dado.");
    if (relative.startsWith("src/services/") && ts.isFunctionDeclaration(node)
      && node.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.AsyncKeyword)
      && node.modifiers.some(modifier => modifier.kind === ts.SyntaxKind.ExportKeyword)
      && !node.type) report(node, "Serviço async deve declarar Promise<T> explicitamente.");
    ts.forEachChild(node, visit);
  };
  visit(source);
}
if (components < 6) issues.push("Pelo menos seis componentes são necessários.");
if (routeParameters === 0) issues.push("Nenhum uso de useParams encontrado.");
if (reducers === 0) issues.push("Nenhum uso de useReducer encontrado.");
if (!fs.readFileSync(path.join(root, "src/routes.tsx"), "utf8").includes('path: "*"')) issues.push("Rota curinga explícita ausente.");
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" }).split("\0");
for (const file of tracked) {
  const name = path.posix.basename(file);
  if ((name === ".env" || name.startsWith(".env.")) && name !== ".env.example") issues.push(`${file}: arquivo de ambiente privado rastreado pelo Git.`);
}
if (issues.length) {
  process.stderr.write(issues.join("\n") + "\n");
  process.exitCode = 1;
} else {
  process.stdout.write(`Rubrica estática: ${files.length} arquivos TypeScript, ${components} módulos de componentes, ${effects} efeitos explícitos. Sem violações verificadas.\n`);
  process.stdout.write("A estrutura flat e as props locais são decisões aceitas; não são sinalizadas como erro. Acessibilidade, deps semânticas, teclado e demonstrações exigem validação adicional.\n");
}
