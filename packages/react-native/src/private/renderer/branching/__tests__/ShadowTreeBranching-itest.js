/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @fantom_flags enableFabricCommitBranching:true
 * @flow strict-local
 * @format
 */

import '@react-native/fantom/src/setUpDefaultReactNativeEnvironment';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {View} from 'react-native';
import NativeFantomTestSpecificMethods from 'react-native/src/private/testing/fantom/specs/NativeFantomTestSpecificMethods';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

describe('ShadowTreeBranching', () => {
  it('should not mount React revision before merging them', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(<View style={{width: 100, height: 100}} nativeID="view" />);
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "view"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "view"}',
    ]);

    NativeFantomTestSpecificMethods.preventNextPromotedRevisionMerge();

    Fantom.runTask(() => {
      root.render(<View style={{width: 50, height: 50}} nativeID="view" />);
    });

    expect(root.takeMountingManagerLogs()).toEqual([]);

    NativeFantomTestSpecificMethods.mergePromotedRevision();

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "view"}',
    ]);
  });

  it('should not skip intermediate React commits', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <View style={{width: 100, height: 100}} nativeID="view">
          <View style={{flex: 1}} nativeID="A" />
          <View style={{flex: 1}} nativeID="B" />
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "view"}',
      'Create {type: "View", nativeID: "A"}',
      'Create {type: "View", nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "view", index: 0, nativeID: "A"}',
      'Insert {type: "View", parentNativeID: "view", index: 1, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "view"}',
    ]);

    NativeFantomTestSpecificMethods.preventNextPromotedRevisionMerge();

    Fantom.runTask(() => {
      root.render(
        <View style={{width: 100, height: 100}} nativeID="view">
          <View style={{flex: 2}} nativeID="A" />
          <View style={{flex: 1}} nativeID="B" />
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([]);

    NativeFantomTestSpecificMethods.preventNextPromotedRevisionMerge();

    Fantom.runTask(() => {
      root.render(
        <View style={{width: 100, height: 100}} nativeID="view">
          <View style={{flex: 2}} nativeID="A" />
          <View style={{flex: 2}} nativeID="B" />
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([]);

    NativeFantomTestSpecificMethods.mergePromotedRevision();

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "A"}',
      'Update {type: "View", nativeID: "B"}',
    ]);
  });

  it('should provide up-to-date data when read from JS', () => {
    const root = Fantom.createRoot();

    const viewRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <View
          ref={viewRef}
          style={{width: 100, height: 100}}
          nativeID="view"
        />,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "view"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "view"}',
    ]);

    NativeFantomTestSpecificMethods.preventNextPromotedRevisionMerge();

    Fantom.runTask(() => {
      root.render(
        <View ref={viewRef} style={{width: 50, height: 50}} nativeID="view" />,
      );
    });

    const viewNode = ensureInstance(viewRef.current, ReactNativeElement);
    const rect = viewNode.getBoundingClientRect();
    expect([rect.width, rect.height]).toEqual([50, 50]);
  });
});
