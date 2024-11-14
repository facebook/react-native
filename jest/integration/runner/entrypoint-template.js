/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @oncall react_native
 */

module.exports = function entrypointTemplate({testPath, setupModulePath}) {
  return `/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * ${'@'}generated
 * @noformat
 * @noflow
 * @oncall react_native
 */

import {registerTest} from '${setupModulePath}';

registerTest(() => require('${testPath}'));
`;
};
