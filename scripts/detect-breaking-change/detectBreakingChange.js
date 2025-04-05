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
const {execSync} = require('child_process');

const ROLLUP_PATH = 'packages/react-native/types/rollup.d.ts';
const BREAKING = true;
const NOT_BREAKING = false;

async function detectBreakingChange() {
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

  const prevoiusStatements = previousRollupAST.program.body;
  const currentStatements = currentRollupAST.program.body;
  const result = analyzeStatements(prevoiusStatements, currentStatements);
  console.log(`IS BREAKING: ${result ? 'YES' : 'NO'}`);
}

function analyzeStatements(
  prevoiusStatements: Array<BabelNodeStatement>,
  currentStatements: Array<BabelNodeStatement>,
): boolean {
  const cache = {
    previous: {
      internal: [],
      external: [],
    },
    new: {
      internal: [],
      external: [],
    },
  } as {
    previous: {
      internal: Array<BabelNodeExportNamedDeclaration>,
      external: Array<BabelNodeExportNamedDeclaration>,
    },
    new: {
      internal: Array<BabelNodeExportNamedDeclaration>,
      external: Array<BabelNodeExportNamedDeclaration>,
    },
  };

  // ImportDeclaration should not have impact on the API
  // If the imported type is used, it will be compared in the next steps
  const prevoiusStatementsFiltered = prevoiusStatements.filter(
    statement => statement.type !== 'ImportDeclaration',
  );
  const currentStatementsFiltered = currentStatements.filter(
    statement => statement.type !== 'ImportDeclaration',
  );

  const categorize = (statements: any, mapping: any) => {
    statements.forEach(statement => {
      if (statement.type === 'ExportNamedDeclaration') {
        mapping.external.push(statement);
      } else {
        mapping.internal.push(statement);
      }
    });
  };

  categorize(prevoiusStatementsFiltered, cache.previous);
  categorize(currentStatementsFiltered, cache.new);

  if (cache.new.external.length < cache.previous.external.length) {
    console.log('External statement removed');
    return BREAKING;
  }

  // Create mapping between previous and new statements
  type Pair = Map<'previous' | 'new', BabelNodeExportNamedDeclaration>;
  const mapping: Array<[string, Pair]> = [];
  const previousNodesMapping = getExportedNodesNames(cache.previous.external);
  const newNodesMapping = Object.fromEntries(
    getExportedNodesNames(cache.new.external),
  );

  for (const [name, previousNode] of previousNodesMapping) {
    if (newNodesMapping[name]) {
      const pairMap: Pair = new Map();
      pairMap.set('new', newNodesMapping[name]);
      pairMap.set('previous', previousNode);
      mapping.push([name, pairMap]);
    } else {
      // There is no statement of that name in the new rollup which means that:
      // 1. This statement was entirely removed
      // 2. This statement was renamed
      // 3. It is not public anymore
      return BREAKING;
    }
  }

  let isBreaking = false;
  for (const [name, pair] of mapping) {
    const previousNode = pair.get('previous');
    const newNode = pair.get('new');
    if (!previousNode || !newNode) {
      throw new Error('Node in pair is undefined');
    }
    const isDiff = didStatementChange(previousNode, newNode);
    if (isDiff) {
      // Let analyze all statements and gather some logs
      console.log(`Breaking change detected for ${name}`);
      isBreaking = true;
    }
  }

  if (isBreaking) return BREAKING;

  return NOT_BREAKING;
}

function getExportedNodesNames(nodes: Array<BabelNodeExportNamedDeclaration>) {
  const nodeNames = [];
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
  return previousCode !== newCode;
}

function getMinifiedCode(ast: BabelNodeStatement) {
  return generate(ast, {
    minified: true,
  }).code;
}

function getRollups(): null | {previousRollup: string, currentRollup: string} {
  let commits: Array<string> = [];
  try {
    commits = execSync('git log --format="%H" -n 2')
      .toString()
      .trim()
      .split('\n');
    if (commits.length < 2) {
      throw new Error('Not enough commits');
    }
  } catch (error) {
    console.error(error);
    return null;
  }

  const currentCommit = commits[0];
  const previousCommit = commits[1];
  let previousRollup = '';
  let currentRollup = '';

  try {
    previousRollup = execSync(
      `git show ${previousCommit}:${ROLLUP_PATH}`,
    ).toString();
    currentRollup = execSync(
      `git show ${currentCommit}:${ROLLUP_PATH}`,
    ).toString();
  } catch (error) {
    console.error(error);
    return null;
  }

  return {previousRollup, currentRollup};
}

module.exports = detectBreakingChange;
