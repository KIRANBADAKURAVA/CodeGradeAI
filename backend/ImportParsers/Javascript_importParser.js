import { parse } from '@babel/parser';
import traverseModule from '@babel/traverse';
const traverse = traverseModule.default;

function extractImports(code) {
  const ast = parse(code, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  });

  const imports = [];

  traverse(ast, {
    // ES6 import statements
    ImportDeclaration(path) {
      const source = path.node.source.value;
      const specifiers = path.node.specifiers;

      specifiers.forEach((specifier) => {
        let importedName;
        if (specifier.type === 'ImportDefaultSpecifier') {
          importedName = specifier.local.name;
        } else if (specifier.type === 'ImportSpecifier') {
          importedName = specifier.local.name; // Use `local` to respect aliasing (e.g. b as beta)
        } else if (specifier.type === 'ImportNamespaceSpecifier') {
          importedName = specifier.local.name;
        }
        console.log(` ${importedName} --> ${source}`);
        imports.push({
          imported: importedName,
          from: source,
        });
      });
    },

    // CommonJS require()
    VariableDeclarator(path) {
      const init = path.node.init;
      const id = path.node.id;

      if (
        init &&
        init.type === 'CallExpression' &&
        init.callee.name === 'require' &&
        init.arguments.length &&
        init.arguments[0].type === 'StringLiteral'
      ) {
        imports.push({
          imported: id.name, // Variable name (e.g. conf)
          from: init.arguments[0].value, // Module path (e.g. './config')
        });
      }
    }
  });

  return imports;
}

export default extractImports