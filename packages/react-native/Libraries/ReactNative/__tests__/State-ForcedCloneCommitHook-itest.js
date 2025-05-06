/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags useShadowNodeStateOnClone:true
 */

import 'react-native/Libraries/Core/InitializeCore';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {ScrollView, View} from 'react-native';
import NativeFantomForcedCloneCommitHook from 'react-native/src/private/testing/fantom/specs/NativeFantomForcedCloneCommitHook';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

NativeFantomForcedCloneCommitHook.setup();

describe('ScrollViewShadowNode', () => {
  it('maintains state after commit hook processing', () => {
    const root = Fantom.createRoot();
    const scrollViewRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <View>
          <ScrollView ref={scrollViewRef} />
          <View nativeID="to-be-cloned-in-the-commit-hook" />
        </View>,
      );
    });

    const scrollViewElement = ensureInstance(
      scrollViewRef.current,
      ReactNativeElement,
    );

    // Scrolling triggers a state update to store the scroll position
    // - the state update gets committed
    // - during the commit, the shadow tree gets processed by the commit hook
    // - the commit hook clones the View with nativeID set to 'to-be-cloned-in-the-commit-hook'
    // - the parent YogaLayoutableShadowNode receives the changed children
    // - this leads to all direct children to be adopted
    // - the ScrollViewShadowNode gets cloned as part of the child adoption
    Fantom.scrollTo(scrollViewElement, {x: 0, y: 777});

    // With the useShadowNodeStateOnClone feature flag enabled, state is maintained after the commit hook processing
    expect(scrollViewElement.scrollTop).toBe(777);
  });
});
