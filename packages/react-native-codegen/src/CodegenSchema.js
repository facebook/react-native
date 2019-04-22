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

export type ObjectPropertyType =
  | $ReadOnly<{|
      type: 'BooleanTypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'StringTypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'FloatTypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'Int32TypeAnnotation',
      name: string,
      optional: boolean,
    |}>
  | $ReadOnly<{|
      type: 'ObjectTypeAnnotation',
      name: string,
      optional: boolean,
      properties: $ReadOnlyArray<ObjectPropertyType>,
    |}>;

type PropTypeTypeAnnotation =
  | $ReadOnly<{|
      type: 'BooleanTypeAnnotation',
      default: boolean,
    |}>
  | $ReadOnly<{|
      type: 'StringTypeAnnotation',
      default: string,
    |}>
  | $ReadOnly<{|
      type: 'FloatTypeAnnotation',
      default: number,
    |}>
  | $ReadOnly<{|
      type: 'Int32TypeAnnotation',
      default: number,
    |}>
  | $ReadOnly<{|
      type: 'StringEnumTypeAnnotation',
      default: string,
      options: $ReadOnlyArray<{|
        name: string,
      |}>,
    |}>
  | $ReadOnly<{|
      type: 'NativePrimitiveTypeAnnotation',
      name: 'ColorPrimitive',
    |}>;

export type PropTypeShape = $ReadOnly<{|
  name: string,
  optional: boolean,
  typeAnnotation: PropTypeTypeAnnotation,
|}>;

export type EventTypeShape = $ReadOnly<{|
  name: string,
  bubblingType: 'direct' | 'bubble',
  optional: boolean,
  typeAnnotation: $ReadOnly<{|
    type: 'EventTypeAnnotation',
    argument: $ReadOnly<{|
      type: 'ObjectTypeAnnotation',
      properties: $ReadOnlyArray<ObjectPropertyType>,
    |}>,
  |}>,
|}>;

export type ComponentShape = $ReadOnly<{|
  extendsProps: $ReadOnlyArray<{|
    type: 'ReactNativeBuiltInType',
    knownTypeName: 'ReactNativeCoreViewProps',
  |}>,
  events: $ReadOnlyArray<EventTypeShape>,
  props: $ReadOnlyArray<PropTypeShape>,
|}>;

export type SchemaType = $ReadOnly<{|
  modules: $ReadOnly<{
    [module: string]: $ReadOnly<{|
      components?: $ReadOnly<{
        [component: string]: ComponentShape,
      }>,
    |}>,
  }>,
|}>;
