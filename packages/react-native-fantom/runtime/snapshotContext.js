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

import {diff} from 'jest-diff';

export type SnapshotConfig = {
  updateSnapshot: 'all' | 'new' | 'none',
  data: {[key: string]: string},
};

export type TestSnapshotResults = {
  [key: string]:
    | {
        pass: true,
      }
    | {
        pass: false,
        value: string,
      },
};

const COMPARISON_EQUALS_STRING = 'Compared values have no visual difference.';

let snapshotConfig: ?SnapshotConfig;

type SnapshotState = {
  callCount: number,
  testFullName: string,
  snapshotResults: TestSnapshotResults,
};

class SnapshotContext {
  #snapshotState: ?SnapshotState = null;

  setTargetTest(testFullName: string) {
    this.#snapshotState = {
      callCount: 0,
      testFullName,
      snapshotResults: {},
    };
  }

  toMatchSnapshot(received: string, label: ?string): void {
    const snapshotState = this.#snapshotState;
    if (snapshotState == null) {
      throw new Error(
        'Snapshot state is not set, call `setTargetTest()` first',
      );
    }

    const snapshotKey = `${snapshotState.testFullName}${
      label != null ? `: ${label}` : ''
    } ${++snapshotState.callCount}`;

    if (snapshotConfig == null) {
      throw new Error(
        'Snapshot config is not set. Did you forget to call `setupSnapshotConfig`?',
      );
    }

    const updateSnapshot = snapshotConfig.updateSnapshot;
    const snapshot = snapshotConfig.data[snapshotKey];

    if (snapshot == null) {
      snapshotState.snapshotResults[snapshotKey] = {
        pass: false,
        value: received,
      };

      if (updateSnapshot === 'none') {
        throw new Error(
          `Expected to have snapshot \`${snapshotKey}\` but it was not found.`,
        );
      }

      return;
    }

    const result = diff(snapshot, received) ?? 'Failed to compare output';
    if (result !== COMPARISON_EQUALS_STRING) {
      snapshotState.snapshotResults[snapshotKey] = {
        pass: false,
        value: received,
      };

      if (updateSnapshot !== 'all') {
        throw new Error(`Expected to match snapshot.\n${result}`);
      }

      return;
    }

    snapshotState.snapshotResults[snapshotKey] = {pass: true};
  }

  getSnapshotResults(): TestSnapshotResults {
    return {...this.#snapshotState?.snapshotResults};
  }
}

export const snapshotContext: SnapshotContext = new SnapshotContext();

export function setupSnapshotConfig(config: SnapshotConfig) {
  snapshotConfig = config;
}
