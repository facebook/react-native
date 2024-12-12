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

import type {TestSnapshotResults} from '../runtime/snapshotContext';
import type {SnapshotState} from 'jest-snapshot';

type JestSnapshotResult = {
  added: number,
  fileDeleted: boolean,
  matched: number,
  unchecked: number,
  uncheckedKeys: string[],
  unmatched: number,
  updated: number,
};

// Add extra line breaks at beginning and end of multiline snapshot
// to make the content easier to read.
const addExtraLineBreaks = (string: string): string =>
  string.includes('\n') ? `\n${string}\n` : string;

// Remove extra line breaks at beginning and end of multiline snapshot.
// Instead of trim, which can remove additional newlines or spaces
// at beginning or end of the content from a custom serializer.
const removeExtraLineBreaks = (string: string): string =>
  string.length > 2 && string.startsWith('\n') && string.endsWith('\n')
    ? string.slice(1, -1)
    : string;

export const getInitialSnapshotData = (
  snapshotState: SnapshotState,
): {[key: string]: string} => {
  const initialData: {[key: string]: string} = {};

  for (const key in snapshotState._initialData) {
    initialData[key] = removeExtraLineBreaks(snapshotState._initialData[key]);
  }

  return initialData;
};

export const updateSnapshotsAndGetJestSnapshotResult = (
  snapshotState: SnapshotState,
  testSnapshotResults: Array<TestSnapshotResults>,
): JestSnapshotResult => {
  for (const snapshotResults of testSnapshotResults) {
    for (const [key, result] of Object.entries(snapshotResults)) {
      if (result.pass) {
        snapshotState.matched++;
        snapshotState._uncheckedKeys.delete(key);
        continue;
      }

      if (snapshotState._snapshotData[key] === undefined) {
        if (snapshotState._updateSnapshot === 'none') {
          snapshotState.unmatched++;
          continue;
        }

        snapshotState._dirty = true;
        snapshotState._snapshotData[key] = addExtraLineBreaks(result.value);
        snapshotState.added++;
        snapshotState.matched++;
        snapshotState._uncheckedKeys.delete(key);

        continue;
      }

      snapshotState._dirty = true;
      snapshotState._snapshotData[key] = addExtraLineBreaks(result.value);
      snapshotState.updated++;
      snapshotState._uncheckedKeys.delete(key);
    }
  }

  const uncheckedCount = snapshotState.getUncheckedCount();
  const uncheckedKeys = snapshotState.getUncheckedKeys();
  if (uncheckedCount) {
    snapshotState.removeUncheckedKeys();
  }

  const status = snapshotState.save();
  return {
    added: snapshotState.added,
    fileDeleted: status.deleted,
    matched: snapshotState.matched,
    unchecked: status.deleted ? 0 : snapshotState.getUncheckedCount(),
    uncheckedKeys: [...uncheckedKeys],
    unmatched: snapshotState.unmatched,
    updated: snapshotState.updated,
  };
};
