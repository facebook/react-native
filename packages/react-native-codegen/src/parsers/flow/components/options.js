/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

'use strict';

import type {OptionsShape} from '../../../CodegenSchema.js';

// $FlowFixMe there's no flowtype for ASTs
type OptionsAST = Object;

function getOptions(optionsExpression: OptionsAST): ?OptionsShape {
  if (!optionsExpression) {
    return null;
  }
  let foundOptions;
  try {
    foundOptions = optionsExpression.properties.reduce((options, prop) => {
      options[prop.key.name] = prop.value.value;
      return options;
    }, {});
  } catch (e) {
    throw new Error(
      'Failed to parse codegen options, please check that they are defined correctly',
    );
  }

  if (
    foundOptions.paperComponentName &&
    foundOptions.paperComponentNameDeprecated
  ) {
    throw new Error(
      'Failed to parse codegen options, cannot use both paperComponentName and paperComponentNameDeprecated',
    );
  }

  return foundOptions;
}

module.exports = {
  getOptions,
};
