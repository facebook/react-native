/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {Root} from '@react-native/fantom';

import * as Fantom from '@react-native/fantom';
import * as React from 'react';

export function testIDPropSuite(
  Component: component(...{testID?: ?string}),
): void {
  let root: Root;

  beforeEach(() => {
    root = Fantom.createRoot();
  });

  afterEach(() => {
    root.destroy();
  });

  describe('testID', () => {
    it('can be set', () => {
      Fantom.runTask(() => {
        root.render(<Component testID="test" />);
      });

      expect(
        root.getRenderedOutput({props: ['testID']}).toJSONObject().props.testID,
      ).toEqual('test');
    });
  });
}
