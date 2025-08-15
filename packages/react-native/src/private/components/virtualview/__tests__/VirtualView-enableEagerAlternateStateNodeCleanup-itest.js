/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_react_fb_flags enableEagerAlternateStateNodeCleanup:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import {createShadowNodeReferenceCountingRef} from '../../../__tests__/utilities/ShadowNodeReferenceCounter';
import VirtualView, {_logs, VirtualViewMode} from '../VirtualView';
import {dispatchModeChangeEvent} from './VirtualView-itest';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {createRef} from 'react';
import {Text} from 'react-native';

beforeEach(() => {
  _logs.states = [];
});

describe('VirtualView with enableEagerAlternateStateNodeCleanup flag', () => {
  test('does not retain shadow node after becoming hidden', () => {
    const root = Fantom.createRoot();

    const [getReferenceCount, childRef] =
      createShadowNodeReferenceCountingRef();
    const viewRef = createRef<React.RefOf<VirtualView>>();

    Fantom.runTask(() => {
      root.render(
        <VirtualView ref={viewRef}>
          <Text ref={childRef}>Child</Text>
        </VirtualView>,
      );
    });

    expect(getReferenceCount()).toBeGreaterThan(0);

    dispatchModeChangeEvent(viewRef.current, VirtualViewMode.Hidden);

    expect(getReferenceCount()).toBe(0);
  });
});
