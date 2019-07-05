/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import type {
  EventTypeShape,
  PropTypeShape,
  CommandTypeShape,
  ExtendsPropsShape,
  SchemaType,
  OptionsShape,
  MethodTypeShape,
} from '../../CodegenSchema.js';

export type SchemaBuilderConfig =
  | $ReadOnly<{|configType: 'module', ...NativeModuleSchemaBuilderConfig|}>
  | $ReadOnly<{|configType: 'component', ...ComponentSchemaBuilderConfig|}>;

type ComponentSchemaBuilderConfig = $ReadOnly<{|
  filename: string,
  componentName: string,
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
  events: $ReadOnlyArray<EventTypeShape>,
  props: $ReadOnlyArray<PropTypeShape>,
  commands: $ReadOnlyArray<CommandTypeShape>,
  options?: ?OptionsShape,
|}>;

type NativeModuleSchemaBuilderConfig = $ReadOnly<{|
  filename: string,
  moduleName: string,
  properties: $ReadOnlyArray<MethodTypeShape>,
|}>;

function buildSchema(schemaInput: SchemaBuilderConfig): SchemaType {
  if (schemaInput.configType === 'component') {
    const {configType, ...componentSchemaInput} = schemaInput;
    return buildComponentSchema(componentSchemaInput);
  } else if (schemaInput.configType === 'module') {
    const {configType, ...moduleSchemaInput} = schemaInput;
    return buildNativeModuleSchema(moduleSchemaInput);
  }
  throw new Error(
    'Expected schema type of module or component, received wrong schema type',
  );
}

function buildComponentSchema({
  filename,
  componentName,
  extendsProps,
  events,
  props,
  options,
  commands,
}: ComponentSchemaBuilderConfig): SchemaType {
  return {
    modules: {
      [filename]: {
        components: {
          [componentName]: {
            ...(options || {}),
            extendsProps,
            events,
            props,
            commands,
          },
        },
      },
    },
  };
}

function buildNativeModuleSchema({
  filename,
  moduleName,
  properties,
}: NativeModuleSchemaBuilderConfig): SchemaType {
  return {
    modules: {
      [filename]: {
        nativeModules: {
          [moduleName]: {
            properties,
          },
        },
      },
    },
  };
}

module.exports = {
  buildSchema,
};
