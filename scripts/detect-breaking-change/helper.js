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

import type {Context} from './detectBreakingChange';

const BREAKING = true;
const NOT_BREAKING = false;

function analyzeLiteralUnionType(
  prevNode: BabelNodeTSUnionType,
  newNode: BabelNodeTSUnionType,
  ctx: Context,
): boolean {
  const isPrevLiteralUnion = prevNode.types.every(
    type => type.type === 'TSLiteralType',
  );
  const isNewLiteralUnion = newNode.types.every(
    type => type.type === 'TSLiteralType',
  );

  if (isPrevLiteralUnion !== isNewLiteralUnion) return BREAKING;
  if (!isPrevLiteralUnion && !isNewLiteralUnion) return NOT_BREAKING;

  const prevLiteralTypes = prevNode.types.map(type =>
    String(type.literal?.value),
  );
  const newLiteralTypes = newNode.types.map(type =>
    String(type.literal?.value),
  );

  if (prevLiteralTypes.length > newLiteralTypes.length) return BREAKING;
  if (prevLiteralTypes.length === newLiteralTypes.length) {
    const typesSet = new Set(newLiteralTypes);
    prevLiteralTypes.forEach(type => {
      if (!typesSet.has(type)) {
        console.log(
          `Could not match previous literal type: ${type} in ${ctx.statementName}`,
        );
        return BREAKING;
      }
    });
  } else {
    const typesSet = new Set(newLiteralTypes);
    prevLiteralTypes.forEach(type => {
      if (!typesSet.has(type)) {
        console.log(
          `Could not match previous literal type: ${type} in ${ctx.statementName}`,
        );
        return BREAKING;
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

  return NOT_BREAKING;
}

function analyzeTypeLiteral(
  prevNode: BabelNodeTSTypeLiteral,
  newNode: BabelNodeTSTypeLiteral,
  ctx: Context,
) {
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
  })

  // compare matched properties
  for (const [name, pair] of mapping) {
    const previousProperty = pair.get('previous');
    const newProperty = pair.get('new');

    if (!previousProperty || !newProperty) {
      throw new Error('Property in pair is undefined');
    }

    analyzeProperties(previousProperty, newProperty, ctx);
  }
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

  // if (prev.typeAnnotation !== current.typeAnnotation) {
  //     console.log('Type annotation changed');
  // }

  // if (prev.initializer !== current.initializer) {
  //     console.log('Initializer changed');
  // }

  // if (prev.key.type !== 'Identifier') {
  //     console.log('Key type changed');
  // }
}

module.exports = {
  analyzeLiteralUnionType,
  analyzeProperties,
  analyzeTypeLiteral,
};
