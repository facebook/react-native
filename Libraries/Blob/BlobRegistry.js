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
  if (!registry.has(collector)) {
    registry.set(collector, 1);
    return;
  }

  const currentCount = registry.get(collector);
  registry.set(collector, currentCount + 1);
};

const unregister = (collector: BlobCollector) => {
  if (!registry.has(collector)) {
    return;
  }

  const currentCount = registry.get(collector);

  if (currentCount <= 1) {
    registry.delete(collector);
    return;
  }

  registry.set(collector, currentCount - 1);
};

const has = (collector: BlobCollector): boolean => {
  return registry.has(collector) && registry.get(collector) > 0;
};

module.exports = {
  register,
  unregister,
  has,
};
