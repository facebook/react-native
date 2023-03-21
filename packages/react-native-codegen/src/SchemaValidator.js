/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

const nullthrows = require('nullthrows');

import type {SchemaType} from './CodegenSchema';

function getErrors(schema: SchemaType): $ReadOnlyArray<string> {
  const errors = new Set<string>();

  // Map of component name -> Array of module names
  const componentModules: Map<string, Array<string>> = new Map();

  Object.keys(schema.modules).forEach(moduleName => {
    const module = schema.modules[moduleName];

    if (module.components == null) {
      return;
    }

    Object.keys(module.components).forEach(componentName => {
      if (module.components == null) {
        return;
      }

      if (!componentModules.has(componentName)) {
        componentModules.set(componentName, []);
      }

      nullthrows(componentModules.get(componentName)).push(moduleName);
    });
  });

  componentModules.forEach((modules, componentName) => {
    if (modules.length > 1) {
      errors.add(
        `Duplicate components found with name ${componentName}. Found in modules ${modules.join(
          ', ',
        )}`,
      );
    }
  });

  return Array.from(errors).sort();
}

function validate(schema: SchemaType) {
  const errors = getErrors(schema);

  if (errors.length !== 0) {
    throw new Error('Errors found validating schema:\n' + errors.join('\n'));
  }
}

module.exports = {
  getErrors,
  validate,
};
