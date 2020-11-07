/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */
import type {BlobCollector} from './BlobTypes';

const registry: WeakMap<BlobCollector, number> = new WeakMap();

const register = (collector: BlobCollector) => {
  const currentCount = registry.get(collector) || 0;
  registry.set(collector, currentCount + 1);
};

const unregister = (collector: BlobCollector) => {
  const currentCount = registry.get(collector) || 0;

  if (currentCount <= 1) {
    registry.delete(collector);
    return;
  }

  registry.set(collector, currentCount - 1);
};

const has = (collector: BlobCollector): boolean => {
  const currentCount = registry.get(collector) || 0;
  return currentCount > 0;
};

module.exports = {
  register,
  unregister,
  has,
};
