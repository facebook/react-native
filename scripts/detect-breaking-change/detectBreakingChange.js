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

const ROLLUP_PATH = 'packages/react-native/types/rollup.d.ts';
const BREAKING = true;
const NOT_BREAKING = false;

export type Context = {
  statementName: string,
};

type Cache = {
  previous: {
    internal: Array<BabelNodeExportNamedDeclaration>,
    external: Array<BabelNodeExportNamedDeclaration>,
  },
  new: {
    internal: Array<BabelNodeExportNamedDeclaration>,
    external: Array<BabelNodeExportNamedDeclaration>,
  },
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
  } as Cache;

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
      const context: Context = {
        statementName: name,
      };
      traverseSubtrees(previousNode, newNode, context);
      // Let analyze all statements and gather some logs
      console.log(`Breaking change detected for ${name}`);
      isBreaking = true;
    }
  }

  if (isBreaking) return BREAKING;

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

function traverseSubtrees(
  prevTree: BabelNode,
  newTree: BabelNode,
  ctx: Context,
): void {
  if (prevTree.type !== newTree.type) {
    return;
  }

  if (prevTree.type === undefined || prevTree.type === null) {
    return;
  }

  // $FlowFixMe[incompatible-use]
  const keys = VISITOR_KEYS[prevTree.type];

  if (!keys) {
    return;
  }

  if (prevTree.type === 'TSUnionType' && newTree.type === 'TSUnionType') {
    return analyzeLiteralUnionType(prevTree, newTree, ctx);
  }

  if (prevTree.type === 'TSTypeLiteral' && newTree.type === 'TSTypeLiteral') {
    return analyzeTypeLiteral(prevTree, newTree, ctx);
  }

  for (const key of keys) {
    const prevChild = prevTree[key];
    const newChild = newTree[key];

    if (
      prevChild === newChild &&
      (newChild === undefined || newChild === null)
    ) {
      continue;
    }

    if (Array.isArray(prevChild) && !Array.isArray(newChild)) {
      return;
    }

    if (Array.isArray(prevChild)) {
      traverseMultiple(prevChild, newChild, ctx);
    } else {
      traverseSubtrees(prevChild, newChild, ctx);
    }
  }
}

function traverseMultiple(
  prevTrees: Array<BabelNode>,
  newTrees: Array<BabelNode>,
  ctx: Context,
) {
  if (prevTrees.length !== newTrees.length) {
    return;
  }

  for (let i = 0; i < prevTrees.length; i++) {
    const prevTree = prevTrees[i];
    const newTree = newTrees[i];
    traverseSubtrees(prevTree, newTree, ctx);
  }
}

function analyzeLiteralUnionType(
  prevNode: BabelNodeTSUnionType,
  newNode: BabelNodeTSUnionType,
  ctx: Context,
): void {
  const isPrevLiteralUnion = prevNode.types.every(
    type => type.type === 'TSLiteralType',
  );
  const isNewLiteralUnion = newNode.types.every(
    type => type.type === 'TSLiteralType',
  );

  if (isPrevLiteralUnion !== isNewLiteralUnion) return;
  if (!isPrevLiteralUnion && !isNewLiteralUnion) return;

  const prevLiteralTypes = prevNode.types.map(type =>
    String(type.literal?.value),
  );
  const newLiteralTypes = newNode.types.map(type =>
    String(type.literal?.value),
  );

  if (prevLiteralTypes.length > newLiteralTypes.length) return;
  if (prevLiteralTypes.length === newLiteralTypes.length) {
    const typesSet = new Set(newLiteralTypes);
    prevLiteralTypes.forEach(type => {
      if (!typesSet.has(type)) {
        console.log(
          `Could not match previous literal type: ${type} in ${ctx.statementName}`,
        );
        return;
      }
    });
  } else {
    const typesSet = new Set(newLiteralTypes);
    prevLiteralTypes.forEach(type => {
      if (!typesSet.has(type)) {
        console.log(
          `Could not match previous literal type: ${type} in ${ctx.statementName}`,
        );
        return;
      }
      typesSet.delete(type);
    });
    const remainingTypes = Array.from(typesSet);
    remainingTypes.forEach(type => {
      console.log(
        `New type added to the union: ${type} in ${ctx.statementName}`,
      );
    });
  }

  return;
}

function analyzeTypeLiteral(
  prevNode: BabelNodeTSTypeLiteral,
  newNode: BabelNodeTSTypeLiteral,
  ctx: Context,
): void {
  type Pair = Map<'previous' | 'new', BabelNodeTSPropertySignature>;
  const mapping: Array<[string, Pair]> = [];

  const prevPropertySignatures = prevNode.members.filter(
    member => member.type === 'TSPropertySignature',
  );
  const newPropertySignatures = newNode.members.filter(
    member => member.type === 'TSPropertySignature',
  );

  const prevPropertiesMapping = getPropertiesMapping(prevPropertySignatures);
  const newPropertiesMapping = Object.fromEntries(
    getPropertiesMapping(newPropertySignatures),
  );

  // pair properties by names
  for (const [name, prevProperty] of prevPropertiesMapping) {
    if (newPropertiesMapping[name]) {
      const pairMap: Pair = new Map();
      pairMap.set('new', newPropertiesMapping[name]);
      pairMap.set('previous', prevProperty);
      delete newPropertiesMapping[name];
    } else {
      // might be removed or renamed
      console.log(
        `Property ${name} was not detected in new ${ctx.statementName}`,
      );
      // TODO: handle removed/renamed properties
    }
  }

  // Check if there are new properties
  const restNewProperties = Object.keys(newPropertiesMapping);
  restNewProperties.forEach(name => {
    // TODO: new properties may also be breaking
    console.log(`New property ${name} added in ${ctx.statementName}`);
  });

  // compare matched properties
  for (const [name, pair] of mapping) {
    const previousProperty = pair.get('previous');
    const newProperty = pair.get('new');

    if (!previousProperty || !newProperty) {
      throw new Error('Property in pair is undefined');
    }

    analyzeProperties(previousProperty, newProperty, ctx);
  }

  return;
}

function getPropertiesMapping(
  properties: Array<BabelNodeTSPropertySignature>,
): Array<[string, BabelNodeTSPropertySignature]> {
  const propertiesMapping: Array<[string, BabelNodeTSPropertySignature]> = [];
  properties.forEach(property => {
    if (property.key.type === 'Identifier') {
      propertiesMapping.push([property.key.name, property]);
    }
  });

  return propertiesMapping;
}

function getNameFromExpression(node: BabelNodeExpression): string | null {
  if (node.type === 'Identifier') {
    return node.name;
  }

  return null;
}

function analyzeProperties(
  prev: BabelNodeTSPropertySignature,
  current: BabelNodeTSPropertySignature,
  ctx: Context,
) {
  const prevName = getNameFromExpression(prev.key);
  const currentName = getNameFromExpression(current.key);

  if (prevName !== currentName && prevName !== null && currentName !== null) {
    console.log(`Previous property ${prevName} renamed to ${currentName}`);
  }

  if (prev.optional !== current.optional) {
    const name = getNameFromExpression(current.key);
    if (prev.optional === true) {
      // TODO: Removing optional property is breaking, for instance passing to a function:
      // type A = {foo?: string}
      // function foo(a: A) {...}
      console.log(
        `Optional property ${name ? `"${name}"` : ''} removed in ${ctx.statementName}`,
      );
    } else {
      // TODO: Adding optional property is breaking, for instance passing a callback:
      // type A = {foo: string}
      // function foo(cb: (a: A) => void) {...}
      console.log(
        `Optional property "${name ? `"${name}"` : ''}" added in ${ctx.statementName}`,
      );
    }
  }

  // TODO: Determine what to do in this case
  if (prev.readonly !== current.readonly) {
    const name = getNameFromExpression(current.key);
    if (prev.readonly === true) {
      console.log(
        `Readonly property ${name ? `"${name}"` : ''} removed in ${ctx.statementName}`,
      );
    } else {
      console.log(
        `Readonly property "${name ? `"${name}"` : ''}" added in ${ctx.statementName}`,
      );
    }
  }

  // TODO: Recurrent call
}

module.exports = detectBreakingChange;
