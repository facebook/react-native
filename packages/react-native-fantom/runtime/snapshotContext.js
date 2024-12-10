/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 */

export type SnapshotConfig = {
  updateSnapshot: 'all' | 'new' | 'none',
  data: {[key: string]: string},
};

let snapshotConfig: ?SnapshotConfig;

// Destructure [err, value] from the return value of getSnapshot
type SnapshotResponse = [null, string] | [string, void];

class SnapshotState {
  #callCount: number = 0;
  #testFullName: string;

  constructor(name: string) {
    this.#testFullName = name;
  }

  getSnapshot(label: ?string): SnapshotResponse {
    const snapshotKey = `${this.#testFullName}${
      label != null ? `: ${label}` : ''
    } ${++this.#callCount}`;

    if (snapshotConfig == null) {
      return [
        'Snapshot config is not set. Did you forget to call `setupSnapshotConfig`?',
        undefined,
      ];
    }

    if (snapshotConfig.data[snapshotKey] == null) {
      return [
        `Expected to have snapshot \`${snapshotKey}\` but it was not found.`,
        undefined,
      ];
    }

    return [null, snapshotConfig.data[snapshotKey]];
  }
}

class SnapshotContext {
  #snapshotState: ?SnapshotState = null;

  setTargetTest(testFullName: string) {
    this.#snapshotState = new SnapshotState(testFullName);
  }

  getSnapshot(label: ?string): SnapshotResponse {
    return (
      this.#snapshotState?.getSnapshot(label) ?? [
        'Snapshot state is not set, call `setTargetTest()` first',
        undefined,
      ]
    );
  }
}

export const snapshotContext: SnapshotContext = new SnapshotContext();

export function setupSnapshotConfig(config: SnapshotConfig) {
  snapshotConfig = config;
}
