/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

'use strict';

import type {SchemaType} from '../../../CodegenSchema';

const {capitalize} = require('../../Utils');
const PojoCollector = require('./PojoCollector');
const {serializePojo} = require('./serializePojo');

type FilesOutput = Map<string, string>;

module.exports = {
  generate(
    libraryName: string,
    schema: SchemaType,
    packageName?: string,
  ): FilesOutput {
    const pojoCollector = new PojoCollector();
    const basePackageName = 'com.facebook.react.viewmanagers';

    Object.keys(schema.modules).forEach(hasteModuleName => {
      const module = schema.modules[hasteModuleName];
      if (module.type !== 'Component') {
        return;
      }

      const {components} = module;
      // No components in this module
      if (components == null) {
        return null;
      }

      Object.keys(components)
        .filter(componentName => {
          const component = components[componentName];
          return !(
            component.excludedPlatforms &&
            component.excludedPlatforms.includes('android')
          );
        })
        .forEach(componentName => {
          const component = components[componentName];
          if (component == null) {
            return;
          }

          const {props} = component;

          pojoCollector.process(
            capitalize(hasteModuleName),
            `${capitalize(componentName)}Props`,
            {
              type: 'ObjectTypeAnnotation',
              properties: props,
            },
          );
        });
    });

    const pojoDir = basePackageName.split('.').join('/');

    return new Map(
      pojoCollector.getAllPojos().map(pojo => {
        return [
          `java/${pojoDir}/${pojo.namespace}/${pojo.name}.java`,
          serializePojo(pojo, basePackageName),
        ];
      }),
    );
  },
};
