/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict
 * @format
 */

const registry: Map<string, number> = new Map();

export const register = (id: string) => {
  const used = registry.get(id);

  if (used != null) {
    registry.set(id, used + 1);
  } else {
    registry.set(id, 1);
  }
};

export const unregister = (id: string) => {
  const used = registry.get(id);

  if (used != null) {
    if (used <= 1) {
      registry.delete(id);
    } else {
      registry.set(id, used - 1);
    }
  }
};

export const has = (id: string): number | boolean => {
  return registry.get(id) || false;
};
