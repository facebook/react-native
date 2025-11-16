/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

import type {
  NativeModuleEventEmitterShape,
  NativeModuleUnionTypeAnnotation,
} from '../../../CodegenSchema';

const {toPascalCase} = require('../../Utils');

const NumberTypes = ['NumberTypeAnnotation', 'NumberLiteralTypeAnnotation'];
const StringTypes = ['StringTypeAnnotation', 'StringLiteralTypeAnnotation'];
const ObjectTypes = ['ObjectTypeAnnotation'];
const BooleanTypes = ['BooleanTypeAnnotation', 'BooleanLiteralTypeAnnotation'];
const ValidTypes = [
  ...NumberTypes,
  ...ObjectTypes,
  ...StringTypes,
  ...BooleanTypes,
];

function getEventEmitterTypeObjCType(
  eventEmitter: NativeModuleEventEmitterShape,
): string {
  const typeAnnotation = eventEmitter.typeAnnotation.typeAnnotation;

  switch (typeAnnotation.type) {
    case 'StringTypeAnnotation':
      return 'NSString *_Nonnull';
    case 'StringLiteralTypeAnnotation':
      return 'NSString *_Nonnull';
    case 'UnionTypeAnnotation':
      const union: NativeModuleUnionTypeAnnotation = typeAnnotation;
      const isUnionOfType = (types: $ReadOnlyArray<string>): boolean => {
        return union.types.every(memberTypeAnnotation =>
          types.includes(memberTypeAnnotation.type),
        );
      };

      if (isUnionOfType(NumberTypes)) {
        return 'NSNumber *_Nonnull';
      }

      if (isUnionOfType(ObjectTypes)) {
        return 'NSDictionary *';
      }

      if (isUnionOfType(StringTypes)) {
        return 'NSString *_Nonnull';
      }

      if (isUnionOfType(BooleanTypes)) {
        return 'BOOL';
      }

      const invalidTypes = union.types.filter(member => {
        return !ValidTypes.includes(member.type);
      });

      throw new Error(
        `Unsupported union member types: ${invalidTypes.join(', ')}"`,
      );
    case 'NumberTypeAnnotation':
    case 'NumberLiteralTypeAnnotation':
      return 'NSNumber *_Nonnull';
    case 'BooleanTypeAnnotation':
      return 'BOOL';
    case 'GenericObjectTypeAnnotation':
    case 'ObjectTypeAnnotation':
    case 'TypeAliasTypeAnnotation':
      return 'NSDictionary *';
    case 'ArrayTypeAnnotation':
      return 'NSArray<id<NSObject>> *';
    case 'DoubleTypeAnnotation':
    case 'FloatTypeAnnotation':
    case 'Int32TypeAnnotation':
    case 'VoidTypeAnnotation':
      // TODO: Add support for these types
      throw new Error(
        `Unsupported eventType for ${eventEmitter.name}. Found: ${eventEmitter.typeAnnotation.typeAnnotation.type}`,
      );
    default:
      (typeAnnotation.type: empty);
      throw new Error(
        `Unsupported eventType for ${eventEmitter.name}. Found: ${eventEmitter.typeAnnotation.typeAnnotation.type}`,
      );
  }
}

function EventEmitterHeaderTemplate(
  eventEmitter: NativeModuleEventEmitterShape,
): string {
  return `- (void)emit${toPascalCase(eventEmitter.name)}${
    eventEmitter.typeAnnotation.typeAnnotation.type !== 'VoidTypeAnnotation'
      ? `:(${getEventEmitterTypeObjCType(eventEmitter)})value`
      : ''
  };`;
}

function EventEmitterImplementationTemplate(
  eventEmitter: NativeModuleEventEmitterShape,
): string {
  return `- (void)emit${toPascalCase(eventEmitter.name)}${
    eventEmitter.typeAnnotation.typeAnnotation.type !== 'VoidTypeAnnotation'
      ? `:(${getEventEmitterTypeObjCType(eventEmitter)})value`
      : ''
  }
{
  _eventEmitterCallback("${eventEmitter.name}", ${
    eventEmitter.typeAnnotation.typeAnnotation.type !== 'VoidTypeAnnotation'
      ? eventEmitter.typeAnnotation.typeAnnotation.type !==
        'BooleanTypeAnnotation'
        ? 'value'
        : '[NSNumber numberWithBool:value]'
      : 'nil'
  });
}`;
}

module.exports = {
  EventEmitterHeaderTemplate,
  EventEmitterImplementationTemplate,
};
