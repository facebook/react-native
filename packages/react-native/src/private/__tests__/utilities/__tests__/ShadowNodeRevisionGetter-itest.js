/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import {createShadowNodeReferenceGetterRef} from '../ShadowNodeRevisionGetter';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {ScrollView, View} from 'react-native';

test('base case when cloning results in revision +1', () => {
  const root = Fantom.createRoot();

  const [getRevision, ref] = createShadowNodeReferenceGetterRef();

  Fantom.runTask(() => {
    root.render(<View ref={ref} />);
  });

  expect(getRevision()).toBe(1);

  Fantom.runTask(() => {
    root.render(<View nativeID="updated" ref={ref} />);
  });

  expect(getRevision()).toBe(2);
});

test('changing height of the top item in ScrollView results in excessive cloning', () => {
  const root = Fantom.createRoot();
  const [getRevision, ref] = createShadowNodeReferenceGetterRef();

  Fantom.runTask(() => {
    root.render(
      <ScrollView>
        <View id="Sibling" style={{height: 1}} />
        <View id="A">
          <View id="B">
            <View id="C">
              <View id="D" ref={ref} />
            </View>
          </View>
        </View>
      </ScrollView>,
    );
  });

  expect(getRevision()).toBe(1);

  Fantom.runTask(() => {
    root.render(
      <ScrollView>
        <View id="Sibling" style={{height: 2}} />
        <View id="A">
          <View id="B">
            <View id="C">
              <View id="D" ref={ref} />
            </View>
          </View>
        </View>
      </ScrollView>,
    );
  });

  // TODO(T225268793): the below assertion should be: `expect(getRevision()).toBe(1);`
  expect(getRevision()).toBe(2);
});
