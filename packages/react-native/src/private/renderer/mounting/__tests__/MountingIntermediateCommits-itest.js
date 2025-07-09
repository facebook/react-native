/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableSynchronousStateUpdates:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {useLayoutEffect, useState} from 'react';
import {ScrollView, View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

function TestComponent({
  triggerIntermediateState,
  simulateUIThreadCommit = false,
}: {
  triggerIntermediateState: boolean,
  simulateUIThreadCommit?: boolean,
}): React.Node {
  const scrollViewRef = React.useRef<?HostInstance>();
  const [intermediateStateTriggered, setIntermediateStateTriggered] =
    useState(false);

  useLayoutEffect(() => {
    if (triggerIntermediateState) {
      setIntermediateStateTriggered(true);
    } else {
      setIntermediateStateTriggered(false);
    }

    // Simulate a commit from the IU thread after the commit that triggered
    // this after, but before the commit that processes the state update in
    // this effect.
    if (simulateUIThreadCommit) {
      const node = ensureInstance(scrollViewRef.current, ReactNativeElement);
      Fantom.runOnUIThread(() => {
        Fantom.enqueueScrollEvent(node, {x: 0, y: 10});
      });
    }
  }, [simulateUIThreadCommit, triggerIntermediateState]);

  const isIntermediateState =
    triggerIntermediateState && !intermediateStateTriggered;

  return (
    <ScrollView nativeID="parent" ref={scrollViewRef}>
      <View
        nativeID={
          isIntermediateState
            ? 'intermediate-state-should-not-be-visible'
            : 'view'
        }
      />
    </ScrollView>
  );
}

/**
 * This test describes an existing bug in Fabric where synchronous commits done
 * in the UI thread can incorrectly apply mutations for intermediate commits
 * from the JavaScript thread.
 */
describe('Mounting intermediate commits', () => {
  it('happens when commiting from the UI thread (bug)', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<TestComponent triggerIntermediateState={false} />);
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: "parent"}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "view"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "view"}',
      'Insert {type: "View", parentNativeID: "parent", index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: "parent"}',
    ]);

    Fantom.runTask(() => {
      root.render(<TestComponent triggerIntermediateState={true} />);
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "view"}',
    ]);

    Fantom.runTask(() => {
      root.render(<TestComponent triggerIntermediateState={false} />);
    });

    expect(root.takeMountingManagerLogs()).toEqual([]);

    Fantom.runTask(() => {
      root.render(
        <TestComponent
          triggerIntermediateState={true}
          simulateUIThreadCommit={true}
        />,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: "parent"}',
      // This should not happen and it's only visible because the update in the
      // scroll view in the UI thread pulls the transactions from this
      // intermediate commit.
      'Update {type: "View", nativeID: "intermediate-state-should-not-be-visible"}',
      'Update {type: "View", nativeID: "view"}',
    ]);
  });
});
