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

import * as Fantom from '@react-native/fantom';
import nullthrows from 'nullthrows';

const now = Fantom.unstable_benchmark.now;

export default function measureRenderTime(
  root: Fantom.Root,
  elements: React.MixedElement,
): number {
  let startTime: ?number;
  let endTime: ?number;

  function RecordStart() {
    startTime ??= now();
    return null;
  }

  function RecordEnd() {
    endTime = now();
    return null;
  }

  Fantom.runTask(() => {
    // React renders nodes using a depth-first algorithm.
    root.render(
      <>
        <RecordStart />
        {elements}
        <RecordEnd />
      </>,
    );
  });

  return nullthrows(endTime) - nullthrows(startTime);
}
