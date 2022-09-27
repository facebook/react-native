/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow strict-local
 */

'use strict';

import type {
  EventTypeShape,
  NamedShape,
  CommandTypeAnnotation,
  PropTypeAnnotation,
  StateTypeAnnotation,
  ExtendsPropsShape,
  SchemaType,
  OptionsShape,
} from '../../../CodegenSchema.js';

export type ComponentSchemaBuilderConfig = $ReadOnly<{
  filename: string,
  componentName: string,
  extendsProps: $ReadOnlyArray<ExtendsPropsShape>,
  events: $ReadOnlyArray<EventTypeShape>,
  props: $ReadOnlyArray<NamedShape<PropTypeAnnotation>>,
  commands: $ReadOnlyArray<NamedShape<CommandTypeAnnotation>>,
  state?: $ReadOnlyArray<NamedShape<StateTypeAnnotation>>,
  options?: ?OptionsShape,
}>;

function wrapComponentSchema({
  filename,
  componentName,
  extendsProps,
  events,
  props,
  state,
  options,
  commands,
}: ComponentSchemaBuilderConfig): SchemaType {
  return {
    modules: {
      [filename]: {
        type: 'Component',
        components: {
          [componentName]: {
            ...(options || {}),
            extendsProps,
            events,
            props,
            commands,
            state,
          },
        },
      },
    },
  };
}

module.exports = {
  wrapComponentSchema,
};
