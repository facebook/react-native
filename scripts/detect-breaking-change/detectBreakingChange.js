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
const traverse = require('@babel/traverse').default;
// $FlowFixMe[prop-missing]
const {VISITOR_KEYS} = require('@babel/types');
const {execSync} = require('child_process');
const fs = require('fs');

const ROLLUP_PATH = 'packages/react-native/types/rollup.d.ts';
const BREAKING = 0;
const POTENTIALLY_NOT_BREAKING = 1;
const NOT_BREAKING = 2;

export type Context = {
  statementName: string,
};

type Cache = {
  old: Array<BabelNodeExportNamedDeclaration>,
  new: Array<BabelNodeExportNamedDeclaration>,
};

function detectBreakingChange() {
  const rollups = getRollups();
  if (!rollups) {
    console.log('No rollups found');
    return;
  }

  const {previousRollup, currentRollup} = rollups;
  const previousRollupAST = babel.parseSync(previousRollup, {
    plugins: ['@babel/plugin-syntax-typescript'],
  });
  const currentRollupAST = babel.parseSync(currentRollup, {
    plugins: ['@babel/plugin-syntax-typescript'],
  });

  const oldStatements = previousRollupAST.program.body;
  const currentStatements = currentRollupAST.program.body;
  const result = analyzeStatements(oldStatements, currentStatements);
  console.log(`RESULT: ${resultToString(result)}`);
}

function analyzeStatements(
  oldStatements: Array<BabelNodeStatement>,
  currentStatements: Array<BabelNodeStatement>,
): number {
  const cache = {
    old: [],
    new: [],
  } as Cache;

  // ImportDeclaration should not have impact on the API
  // If the imported type is used, it will be compared in the next steps
  const oldStatementsFiltered = oldStatements.filter(
    statement => statement.type !== 'ImportDeclaration',
  );
  const currentStatementsFiltered = currentStatements.filter(
    statement => statement.type !== 'ImportDeclaration',
  );

  const categorize = (statements: any, mapping: any) => {
    statements.forEach(statement => {
      if (statement.type === 'ExportNamedDeclaration') {
        mapping.push(statement);
      }
    });
  };

  categorize(oldStatementsFiltered, cache.old);
  categorize(currentStatementsFiltered, cache.new);

  if (cache.new.length < cache.old.length) {
    console.log('External statement removed');
    return BREAKING;
  }

  // Create a mapping between old and new statements
  type Pair = Map<'old' | 'new', BabelNodeExportNamedDeclaration>;
  const mapping: Array<[string, Pair]> = [];
  const oldNodesMapping = getExportedNodesNames(cache.old);
  const newNodesMapping = Object.fromEntries(getExportedNodesNames(cache.new));

  for (const [name, oldNode] of oldNodesMapping) {
    if (newNodesMapping[name]) {
      const pairMap: Pair = new Map();
      pairMap.set('new', newNodesMapping[name]);
      pairMap.set('old', oldNode);
      mapping.push([name, pairMap]);
    } else {
      // There is no statement of that name in the new rollup which means that:
      // 1. This statement was entirely removed
      // 2. This statement was renamed
      // 3. It is not public anymore
      return BREAKING;
    }
  }

  for (const [name, pair] of mapping) {
    const previousNode = pair.get('old');
    const newNode = pair.get('new');
    if (!previousNode || !newNode) {
      throw new Error('Node in pair is undefined');
    }
    if (didStatementChange(previousNode, newNode)) {
      console.log(`Statement ${name} changed`);
      return BREAKING;
    }
  }

  if (cache.new.length > cache.old.length) {
    console.log('New statement added');
    return POTENTIALLY_NOT_BREAKING;
  }

  return NOT_BREAKING;
}

function getExportedNodesNames(
  nodes: Array<BabelNodeExportNamedDeclaration>,
): Array<[string, BabelNodeExportNamedDeclaration]> {
  const nodeNames: Array<[string, BabelNodeExportNamedDeclaration]> = [];
  nodes.forEach(node => {
    if (node.declaration) {
      const name = getExportedNodeName(node);
      nodeNames.push([name, node]);
    }
  });

  return nodeNames;
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
  // console.log({previousCode}, {newCode})
  return previousCode !== newCode;
}

function getMinifiedCode(ast: BabelNodeStatement) {
  return generate(ast, {
    minified: true,
  }).code;
}

function getRollups(): null | {previousRollup: string, currentRollup: string} {
  // let commits: Array<string> = [];
  // try {
  //   commits = execSync('git log --format="%H" -n 2')
  //     .toString()
  //     .trim()
  //     .split('\n');
  //   if (commits.length < 2) {
  //     throw new Error('Not enough commits');
  //   }
  // } catch (error) {
  //   console.error(error);
  //   return null;
  // }

  // const currentCommit = commits[0];
  // const previousCommit = commits[1];
  // let previousRollup = '';
  // let currentRollup = '';

  // try {
  //   previousRollup = execSync(
  //     `git show ${previousCommit}:${ROLLUP_PATH}`,
  //   ).toString();
  //   currentRollup = execSync(
  //     `git show ${currentCommit}:${ROLLUP_PATH}`,
  //   ).toString();
  // } catch (error) {
  //   console.error(error);
  //   return null;
  // }

  const currentRollup = fs.readFileSync(
    'packages/react-native/types/rollup-new.d.ts',
    'utf8',
  );
  const previousRollup = fs.readFileSync(
    'packages/react-native/types/rollup-old.d.ts',
    'utf8',
  );

  return {previousRollup, currentRollup};
}

function resultToString(res: number): string {
  switch (res) {
    case BREAKING:
      return 'BREAKING';
    case POTENTIALLY_NOT_BREAKING:
      return 'POTENTIALLY_NOT_BREAKING';
    case NOT_BREAKING:
      return 'NOT_BREAKING';
    default:
      throw new Error('Unknown result in resultToString');
  }
}

module.exports = detectBreakingChange;
