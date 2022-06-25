/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

// adapated from https://github.com/web-platform-tests/wpt/blob/master/pointerevents/pointerevent_pointermove.html

import type {PlatformTestComponentBaseProps} from '../PlatformTest/RNTesterPlatformTestTypes';
import type {PointerEvent} from 'react-native/Libraries/Types/CoreEventTypes';

import {useTestEventHandler} from './PointerEventSupport';
import RNTesterPlatformTest from '../PlatformTest/RNTesterPlatformTest';
import * as React from 'react';
import {useRef} from 'react';
import {StyleSheet, View} from 'react-native';

function PointerEventPointerMoveTestCase(
  props: PlatformTestComponentBaseProps,
) {
  const {harness} = props;

  const detectedPointerTypesRef = useRef({});
  const testPointerMove = harness.useAsyncTest('pointermove event recieved');

  const handlers = useTestEventHandler(
    ['pointerMove2'],
    (event: PointerEvent) => {
      detectedPointerTypesRef.current[event.nativeEvent.pointerType] = true;
      testPointerMove.done();
    },
  );

  return <View {...handlers} style={styles.target} />;
}

const styles = StyleSheet.create({
  target: {
    backgroundColor: 'black',
    height: 64,
    width: '100%',
  },
});

type Props = $ReadOnly<{}>;
export default function PointerEventPointerMove(
  props: Props,
): React.MixedElement {
  return (
    <RNTesterPlatformTest
      component={PointerEventPointerMoveTestCase}
      description="This test checks if pointermove event triggers. Move your mouse over the black rectangle or slide it if you are using touchscreen."
      title="PointerMove test"
    />
  );
}
