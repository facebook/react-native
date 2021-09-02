/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {
  ObjectParamTypeAnnotation,
  ObjectTypeAliasTypeShape,
} from '../../../CodegenSchema';
const {getTypeAliasTypeAnnotation} = require('../Utils');

function capitalizeFirstLetter(string: string): string {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function flatObjects(
  annotations: $ReadOnlyArray<
    $ReadOnly<{|
      name: string,
      object: $ReadOnly<{|
        type: 'ObjectTypeAnnotation',
        properties: $ReadOnlyArray<ObjectParamTypeAnnotation>,
      |}>,
    |}>,
  >,
  forConstants: boolean = false,
  aliases: $ReadOnly<{[aliasName: string]: ObjectTypeAliasTypeShape, ...}>,
): $ReadOnlyArray<
  $ReadOnly<{|
    name: string,
    properties: $ReadOnlyArray<ObjectParamTypeAnnotation>,
  |}>,
> {
  let objectTypesToFlatten: Array<{|
    properties: $ReadOnlyArray<ObjectParamTypeAnnotation>,
    name: string,
  |}> = annotations
    .map(annotation => {
      if (annotation.object.type === 'TypeAliasTypeAnnotation') {
        const alias = getTypeAliasTypeAnnotation(annotation.name, aliases);
        return {name: annotation.name, properties: alias.properties};
      }
      return {
        name: annotation.name,
        properties: annotation.object.properties,
      };
    })
    .filter(
      annotation =>
        (annotation.name === 'SpecGetConstantsReturnType') === forConstants,
    )
    .filter(
      annotation =>
        annotation.name !== 'SpecGetConstantsReturnType' ||
        annotation.properties.length > 0,
    );

  let flattenObjects: Array<{|
    properties: $ReadOnlyArray<ObjectParamTypeAnnotation>,
    name: string,
  |}> = [];

  while (objectTypesToFlatten.length !== 0) {
    const oldObjectTypesToFlatten = objectTypesToFlatten;
    objectTypesToFlatten = [];
    flattenObjects = flattenObjects.concat(
      oldObjectTypesToFlatten.map(object => {
        const {properties} = object;
        if (properties !== undefined) {
          objectTypesToFlatten = objectTypesToFlatten.concat(
            properties.reduce((acc, curr) => {
              if (
                curr.typeAnnotation &&
                curr.typeAnnotation.type === 'ObjectTypeAnnotation' &&
                curr.typeAnnotation.properties
              ) {
                return acc.concat({
                  properties: curr.typeAnnotation.properties,
                  name: object.name + capitalizeFirstLetter(curr.name),
                });
              }
              return acc;
            }, []),
          );
        }
        return object;
      }),
    );
  }

  return flattenObjects;
}

function getSafePropertyName(property: ObjectParamTypeAnnotation): string {
  if (property.name === 'id') {
    return `${property.name}_`;
  }
  return property.name;
}

module.exports = {
  flatObjects,
  capitalizeFirstLetter,
  getSafePropertyName,
};
