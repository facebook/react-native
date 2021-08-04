/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

const experiments = {
  useVLOptimization: false,
};

export function setUseVLOptimization() {
  experiments.useVLOptimization = true;
}

export default (experiments: {useVLOptimization: boolean});
