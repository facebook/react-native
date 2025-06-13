/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 * @oncall react_native
 */

const babel = require('@babel/core');
const generate = require('@babel/generator').default;

enum Result {
  BREAKING = 'BREAKING',
  POTENTIALLY_NON_BREAKING = 'POTENTIALLY_NON_BREAKING',
  NON_BREAKING = 'NON_BREAKING',
}

type Output = {
  result: Result,
  changedApis: Array<string>,
};

function diffApiSnapshot(prevSnapshot: string, newSnapshot: string): Output {
  const prevSnapshotAST = babel.parseSync(prevSnapshot, {
    plugins: ['@babel/plugin-syntax-typescript'],
  });
  const newSnapshotAST = babel.parseSync(newSnapshot, {
    plugins: ['@babel/plugin-syntax-typescript'],
  });
  const prevStatements = getExportedStatements(prevSnapshotAST);
  const newStatements = getExportedStatements(newSnapshotAST);

  return analyzeStatements(prevStatements, newStatements);
}

function getExportedStatements(
  ast: BabelNodeFile,
): Array<BabelNodeExportNamedDeclaration> {
  return ast.program.body.filter(
    statement => statement.type === 'ExportNamedDeclaration',
  );
}

function analyzeStatements(
  prevStatements: Array<BabelNodeExportNamedDeclaration>,
  newStatements: Array<BabelNodeExportNamedDeclaration>,
): Output {
  const output = {
    result: Result.NON_BREAKING,
    changedApis: [],
  } as Output;

  // Create a mapping between prev and new statements
  type Pair = Map<'prev' | 'new', BabelNodeExportNamedDeclaration>;
  const mapping: Array<[string, Pair]> = [];
  const prevNodesMapping = getExportedNodesNames(prevStatements);
  const newNodesMapping = Object.fromEntries(
    getExportedNodesNames(newStatements),
  );

  for (const [name, prevNode] of prevNodesMapping) {
    if (newNodesMapping[name]) {
      const pairMap: Pair = new Map();
      pairMap.set('new', newNodesMapping[name]);
      pairMap.set('prev', prevNode);
      mapping.push([name, pairMap]);
      // remove the node to check if there are any new nodes later
      delete newNodesMapping[name];
    } else {
      // There is no statement of that name in the new rollup which means that:
      // 1. This statement was entirely removed
      // 2. This statement was renamed
      // 3. It is not public anymore
      output.result = Result.BREAKING;
      output.changedApis.push(stripSuffix(name));
    }
  }

  for (const [name, pair] of mapping) {
    const prevNode = pair.get('prev');
    const newNode = pair.get('new');
    if (!prevNode || !newNode) {
      throw new Error('Node in pair is undefined');
    }
    if (didStatementChange(prevNode, newNode)) {
      output.result = Result.BREAKING;
      output.changedApis.push(stripSuffix(name));
    }
  }

  // if all prev nodes are matched and there are some new nodes left
  if (
    output.result === Result.NON_BREAKING &&
    Object.keys(newNodesMapping).length > 0
  ) {
    // New statement added
    output.result = Result.POTENTIALLY_NON_BREAKING;
    for (const name of Object.keys(newNodesMapping)) {
      output.changedApis.push(stripSuffix(name));
    }
  }

  return output;
}

function getExportedNodesNames(
  nodes: Array<BabelNodeExportNamedDeclaration>,
): Array<[string, BabelNodeExportNamedDeclaration]> {
  const nodeNames: Array<[string, BabelNodeExportNamedDeclaration]> = [];
  nodes.forEach(node => {
    if (node.declaration) {
      let name = getExportedNodeName(node);
      // for declare const/type case we get two statements with the same name
      // export declare const foo = string;
      // export declare type foo = typeof foo;
      // we add a _type and _var suffix to differentiate them
      if (node.declaration?.type === 'TSTypeAliasDeclaration') {
        name += '__type';
      } else if (node.declaration?.type === 'VariableDeclaration') {
        name += '__var';
      }
      nodeNames.push([name, node]);
    }
  });

  return nodeNames;
}

function stripSuffix(name: string): string {
  const regex = /(__type|__var)$/;
  return name.replace(regex, '');
}

function getExportedNodeName(node: BabelNodeExportNamedDeclaration): string {
  if (node.declaration?.type === 'TSTypeAliasDeclaration') {
    return node.declaration.id.name;
  } else if (node.declaration?.type === 'VariableDeclaration') {
    if (node.declaration.declarations.length !== 1) {
      throw new Error('Unsupported number of variable declarations');
    }
    const variableDeclaration = node.declaration.declarations[0];
    if (variableDeclaration.id.type !== 'Identifier') {
      throw new Error('Variable declaration id type is not Identifier');
    }

    return variableDeclaration.id.name;
  } else if (node.declaration?.type === 'ClassDeclaration') {
    if (!node.declaration.id) {
      throw new Error('Class declaration id is undefined');
    }

    return node.declaration.id.name;
  } else if (node.declaration?.type === 'TSModuleDeclaration') {
    if (node.declaration.id.type === 'StringLiteral') {
      return node.declaration.id.value;
    } else {
      return node.declaration.id.name;
    }
  } else if (node.declaration?.type === 'TSDeclareFunction') {
    if (!node.declaration.id) {
      throw new Error('Function declaration id is undefined');
    }
    return node.declaration.id?.name;
  } else if (node.declaration?.type === 'TSInterfaceDeclaration') {
    return node.declaration.id.name;
  }

  throw new Error('Unsupported node declaration type');
}

function didStatementChange(
  previousAST: BabelNodeStatement,
  newAST: BabelNodeStatement,
) {
  const previousCode = getMinifiedCode(previousAST);
  const newCode = getMinifiedCode(newAST);
  return previousCode !== newCode;
}

function getMinifiedCode(ast: BabelNodeStatement) {
  return generate(ast, {
    minified: true,
  }).code;
}

module.exports = {diffApiSnapshot, Result};
