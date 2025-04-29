/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 * @oncall react_native
 * @fantom_flags enableViewCulling:true
 * @fantom_flags enableSynchronousStateUpdates:true
 * @fantom_flags enableFixForParentTagDuringReparenting:true
 */

import 'react-native/Libraries/Core/InitializeCore.js';

import type {HostInstance} from 'react-native';

import ensureInstance from '../../../../src/private/__tests__/utilities/ensureInstance';
import * as Fantom from '@react-native/fantom';
import * as React from 'react';
import {Modal, ScrollView, View} from 'react-native';
import ReactNativeElement from 'react-native/src/private/webapis/dom/nodes/ReactNativeElement';

test('basic culling', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
        <View
          nativeID={'child'}
          style={{height: 10, width: 10, marginTop: 45}}
        />
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 60,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    'Delete {type: "View", nativeID: "child"}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Delete {type: "View", nativeID: (N/A)}',
    'Update {type: "ScrollView", nativeID: (N/A)}',
  ]);

  Fantom.scrollTo(element, {
    x: 0,
    y: 0,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
  ]);
});

test('recursive culling', () => {
  const root = Fantom.createRoot({viewportHeight: 100, viewportWidth: 100});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
        <View
          nativeID={'element A'}
          style={{height: 30, width: 30, marginTop: 25}}>
          <View nativeID={'child AA'} style={{height: 10, width: 10}} />
          <View
            nativeID={'child AB'}
            style={{height: 10, width: 10, marginTop: 5}}
          />
        </View>
        <View
          nativeID={'element B'}
          style={{height: 30, width: 30, marginTop: 195}}>
          <View nativeID={'child BA'} style={{height: 10, width: 10}} />
          <View
            nativeID={'child BB'}
            style={{height: 10, width: 10, marginTop: 5}}
          />
        </View>
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element A"}',
    'Create {type: "View", nativeID: "child AA"}',
    'Create {type: "View", nativeID: "child AB"}',
    'Insert {type: "View", parentNativeID: "element A", index: 0, nativeID: "child AA"}',
    'Insert {type: "View", parentNativeID: "element A", index: 1, nativeID: "child AB"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  // === Scroll down to the edge of child AA ===
  Fantom.scrollTo(element, {
    x: 0,
    y: 30,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
  ]);

  // === Scroll down past child AA ===

  Fantom.scrollTo(element, {
    x: 0,
    y: 36,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Remove {type: "View", parentNativeID: "element A", index: 0, nativeID: "child AA"}',
    'Delete {type: "View", nativeID: "child AA"}',
  ]);

  // === Scroll down past child AB ===
  Fantom.scrollTo(element, {
    x: 0,
    y: 51,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Remove {type: "View", parentNativeID: "element A", index: 0, nativeID: "child AB"}',
    'Delete {type: "View", nativeID: "child AB"}',
  ]);

  // === Scroll down past element A ===
  Fantom.scrollTo(element, {
    x: 0,
    y: 56,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Delete {type: "View", nativeID: "element A"}',
  ]);

  // Scroll element B into viewport. Just child BA should be created.
  Fantom.scrollTo(element, {
    x: 0,
    y: 155,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element B"}',
    'Create {type: "View", nativeID: "child BA"}',
    'Insert {type: "View", parentNativeID: "element B", index: 0, nativeID: "child BA"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element B"}',
  ]);

  // Scroll child BA into viewport.
  Fantom.scrollTo(element, {
    x: 0,
    y: 165,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child BB"}',
    'Insert {type: "View", parentNativeID: "element B", index: 1, nativeID: "child BB"}',
  ]);

  // Scroll back to start
  Fantom.scrollTo(element, {
    x: 0,
    y: 0,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Remove {type: "View", parentNativeID: "element B", index: 1, nativeID: "child BB"}',
    'Remove {type: "View", parentNativeID: "element B", index: 0, nativeID: "child BA"}',
    'Delete {type: "View", nativeID: "child BA"}',
    'Delete {type: "View", nativeID: "child BB"}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element B"}',
    'Delete {type: "View", nativeID: "element B"}',
    'Create {type: "View", nativeID: "element A"}',
    'Create {type: "View", nativeID: "child AA"}',
    'Create {type: "View", nativeID: "child AB"}',
    'Insert {type: "View", parentNativeID: "element A", index: 0, nativeID: "child AA"}',
    'Insert {type: "View", parentNativeID: "element A", index: 1, nativeID: "child AB"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
  ]);

  // Scroll past element A
  Fantom.scrollTo(element, {
    x: 0,
    y: 85,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Remove {type: "View", parentNativeID: "element A", index: 1, nativeID: "child AB"}',
    'Remove {type: "View", parentNativeID: "element A", index: 0, nativeID: "child AA"}',
    'Delete {type: "View", nativeID: "child AA"}',
    'Delete {type: "View", nativeID: "child AB"}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Delete {type: "View", nativeID: "element A"}',
  ]);
});

test('recursive culling when initial offset is negative', () => {
  const root = Fantom.createRoot({viewportHeight: 874, viewportWidth: 402});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        style={{height: 874, width: 402}}
        contentOffset={{x: 0, y: -10000}}
        ref={nodeRef}>
        <View
          nativeID={'child A'}
          style={{height: 100, width: 100, marginTop: 235}}
        />
        <View
          nativeID={'child B'}
          style={{height: 100, width: 100, marginTop: 235}}>
          <View nativeID={'child BA'} style={{height: 17, width: 100}} />
          <View
            nativeID={'child BB'}
            style={{height: 17, width: 100, marginTop: 60}}
          />
        </View>
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 0,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child A"}',
    'Create {type: "View", nativeID: "child B"}',
    'Create {type: "View", nativeID: "child BA"}',
    'Create {type: "View", nativeID: "child BB"}',
    'Insert {type: "View", parentNativeID: "child B", index: 0, nativeID: "child BA"}',
    'Insert {type: "View", parentNativeID: "child B", index: 1, nativeID: "child BB"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 1, nativeID: "child B"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
  ]);
});

test('deep nesting', () => {
  const root = Fantom.createRoot({viewportHeight: 100, viewportWidth: 100});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
        <View
          nativeID={'element A'}
          style={{height: 10, width: 100, marginTop: 30}}
        />
        <View
          nativeID={'element B'}
          style={{height: 50, width: 100, marginTop: 85}}>
          <View
            nativeID={'child BA'}
            style={{height: 30, width: 80, marginTop: 10, marginLeft: 10}}>
            <View
              nativeID={'child BAA'}
              style={{height: 10, width: 75, marginTop: 5, marginLeft: 5}}
            />
            <View
              nativeID={'child BAB'}
              style={{height: 10, width: 75, marginTop: 15, marginLeft: 5}}
            />
          </View>
        </View>
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 40,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element B"}',
    'Create {type: "View", nativeID: "child BA"}',
    'Create {type: "View", nativeID: "child BAA"}',
    'Insert {type: "View", parentNativeID: "child BA", index: 0, nativeID: "child BAA"}',
    'Insert {type: "View", parentNativeID: "element B", index: 0, nativeID: "child BA"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 1, nativeID: "element B"}',
  ]);

  Fantom.scrollTo(element, {
    x: 0,
    y: 150,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Delete {type: "View", nativeID: "element A"}',
    'Create {type: "View", nativeID: "child BAB"}',
    'Insert {type: "View", parentNativeID: "child BA", index: 1, nativeID: "child BAB"}',
  ]);
});

test('adding new item into area that is not culled', () => {
  const root = Fantom.createRoot({viewportHeight: 100, viewportWidth: 100});

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}}>
        <View
          nativeID={'element A'}
          style={{height: 20, width: 20, marginTop: 30}}
        />
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}}>
        <View
          nativeID={'element A'}
          style={{height: 20, width: 20, marginTop: 30}}>
          <View nativeID={'child AA'} style={{height: 20, width: 20}} />
        </View>
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Create {type: "View", nativeID: "child AA"}',
    'Insert {type: "View", parentNativeID: "element A", index: 0, nativeID: "child AA"}',
  ]);
});

test('adding new item into area that is culled', () => {
  const root = Fantom.createRoot({viewportHeight: 100, viewportWidth: 100});

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        contentOffset={{x: 0, y: 45}}
        style={{height: 100, width: 100}}>
        <View
          key="element B"
          nativeID={'element B'}
          style={{height: 20, width: 20, marginTop: 30}}
        />
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element B"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element B"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        contentOffset={{x: 0, y: 45}}
        style={{height: 100, width: 100}}>
        <View
          key="element A"
          nativeID={'element A'}
          style={{height: 20, width: 20}}
        />
        <View
          key="element B"
          nativeID={'element B'}
          style={{height: 20, width: 20, marginTop: 10}}
        />
      </ScrollView>,
    );
  });

  // element B is updated but it should be inconsequential.
  // Differentiator generates an update for it because Yoga cloned
  // shadow node backing element B.
  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "View", nativeID: "element B"}',
  ]);
});

test('initial render', () => {
  const nodeRef = React.createRef<HostInstance>();
  const root = Fantom.createRoot({viewportHeight: 100, viewportWidth: 100});

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        contentOffset={{x: 0, y: 45}}
        ref={nodeRef}
        style={{height: 100, width: 100}}>
        <View nativeID={'element A'} style={{height: 50, width: 100}} />
        <View
          nativeID={'element B'}
          style={{height: 50, width: 100, marginTop: 100}}>
          <View nativeID={'child BA'} style={{height: 20, width: 100}} />
          <View
            nativeID={'child BB'}
            style={{height: 20, width: 100, marginTop: 10}}
          />
        </View>
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 100,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element A"}',
    'Delete {type: "View", nativeID: "element A"}',
    'Create {type: "View", nativeID: "element B"}',
    'Create {type: "View", nativeID: "child BA"}',
    'Create {type: "View", nativeID: "child BB"}',
    'Insert {type: "View", parentNativeID: "element B", index: 0, nativeID: "child BA"}',
    'Insert {type: "View", parentNativeID: "element B", index: 1, nativeID: "child BB"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element B"}',
  ]);
});

test('unmounting culled elements', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        style={{height: 100, width: 100}}
        contentOffset={{x: 0, y: 20}}>
        <View nativeID={'element 1'} style={{height: 10, width: 10}} />
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  Fantom.runTask(() => {
    root.render(<></>);
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Remove {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    'Delete {type: "ScrollView", nativeID: (N/A)}',
  ]);
});

// TODO: only elements in ScrollView are culled.
test('basic culling smaller ScrollView', () => {
  const nodeRef = React.createRef<HostInstance>();
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

  Fantom.runTask(() => {
    root.render(
      <ScrollView ref={nodeRef} style={{height: 50, width: 50, marginTop: 25}}>
        <View nativeID={'element 1'} style={{height: 10, width: 10}} />
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "element 1"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element 1"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 11,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "element 1"}',
    'Delete {type: "View", nativeID: "element 1"}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Delete {type: "View", nativeID: (N/A)}',
    'Update {type: "ScrollView", nativeID: (N/A)}',
  ]);
});

test('views are not culled when outside of viewport', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

  Fantom.runTask(() => {
    root.render(
      <View
        nativeID={'child'}
        style={{height: 10, width: 10, marginTop: 101}}
      />,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "child"}',
  ]);
});

test('culling with transform move', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
        <View
          nativeID={'child'}
          style={{
            height: 10,
            width: 10,
            marginTop: 90,
            transform: [{translateY: 11}],
          }}
        />
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 1,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
  ]);
});

test('culling with recursive transform move', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
        <View style={{transform: [{translateY: 11}]}}>
          <View
            nativeID={'child'}
            style={{
              height: 10,
              width: 10,
              marginTop: 90,
            }}
          />
        </View>
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 1,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
  ]);
});

test('culling with transform scale', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
        <View
          nativeID={'child'}
          style={{
            height: 10,
            width: 10,
            marginTop: 105,
            transform: [{scale: 2}],
          }}
        />
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.scrollTo(element, {
    x: 0,
    y: 121,
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    'Delete {type: "View", nativeID: "child"}',
    'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Delete {type: "View", nativeID: (N/A)}',
    'Update {type: "ScrollView", nativeID: (N/A)}',
  ]);
});

test('culling when ScrollView parent has transform', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

  Fantom.runTask(() => {
    root.render(
      <View style={{transform: [{translateY: 100}]}}>
        <ScrollView style={{height: 100, width: 100}}>
          <View
            nativeID={'child'}
            style={{height: 10, width: 10, marginTop: 45}}
          />
        </ScrollView>
      </View>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
  ]);
});

test('culling inside of Modal', () => {
  const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
  const nodeRef = React.createRef<HostInstance>();

  Fantom.runTask(() => {
    root.render(
      // <ScrollView /> is scrolled down and if it wasn't for the Modal,
      // the content would be culled.
      <ScrollView
        contentOffset={{x: 0, y: 100}}
        style={{height: 100, width: 100}}>
        <Modal ref={nodeRef} />
      </ScrollView>,
    );
  });

  const element = ensureInstance(nodeRef.current, ReactNativeElement);

  Fantom.runOnUIThread(() => {
    Fantom.enqueueModalSizeUpdate(element, {
      width: 100,
      height: 100,
    });
  });
  Fantom.runWorkLoop();

  expect(root.takeMountingManagerLogs()).toEqual([
    'Update {type: "RootView", nativeID: (root)}',
    'Create {type: "ScrollView", nativeID: (N/A)}',
    'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Create {type: "ModalHostView", nativeID: (root)}',
    'Create {type: "View", nativeID: (N/A)}',
    'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    'Insert {type: "ModalHostView", parentNativeID: (N/A), index: 0, nativeID: (root)}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
  ]);

  Fantom.runTask(() => {
    root.render(
      <ScrollView
        contentOffset={{x: 0, y: 100}}
        style={{height: 100, width: 100}}>
        <Modal ref={nodeRef}>
          <View
            nativeID={'child'}
            style={{height: 10, width: 10, marginTop: 45}}
          />
        </Modal>
      </ScrollView>,
    );
  });

  expect(root.takeMountingManagerLogs()).toEqual([
    'Create {type: "View", nativeID: "child"}',
    'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
  ]);
});

describe('reparenting', () => {
  test('view flattening with culling', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
    const nodeRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
          <View
            style={{
              marginTop: 150,
            }}>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, backgroundColor: 'red'}}
            />
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    Fantom.scrollTo(element, {
      x: 0,
      y: 60,
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    ]);

    // force view to be unflattened.
    Fantom.runTask(() => {
      root.render(
        <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
          <View
            style={{
              marginTop: 150,
              opacity: 0, // force view to be unflattened
            }}>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, backgroundColor: 'red'}}
            />
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    ]);

    // force view to be flattened.
    Fantom.runTask(() => {
      root.render(
        <ScrollView style={{height: 100, width: 100}} ref={nodeRef}>
          <View
            style={{
              marginTop: 150,
            }}>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, backgroundColor: 'red'}}
            />
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    ]);
  });

  test('scroll view parent is unflattened and culled view becomes visible', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    Fantom.runTask(() => {
      root.render(
        <View style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 150}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <View nativeID="unflattened" style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 50}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Remove {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
      'Create {type: "View", nativeID: "unflattened"}',
      'Update {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "unflattened"}',
      'Insert {type: "ScrollView", parentNativeID: "unflattened", index: 0, nativeID: (N/A)}',
    ]);
  });

  test('scroll view parent is flattened and culled view becomes visible', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    Fantom.runTask(() => {
      root.render(
        <View nativeID="unflattened" style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 150}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "unflattened"}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: "unflattened", index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "unflattened"}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <View style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 50}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Remove {type: "ScrollView", parentNativeID: "unflattened", index: 0, nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: (root), index: 0, nativeID: "unflattened"}',
      'Delete {type: "View", nativeID: "unflattened"}',
      'Update {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);
  });

  test('scroll view parent is flattened and view becomes culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    Fantom.runTask(() => {
      root.render(
        <View nativeID="unflattened" style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 50}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "unflattened"}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: "unflattened", index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "unflattened"}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <View style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 150}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Remove {type: "ScrollView", parentNativeID: "unflattened", index: 0, nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: (root), index: 0, nativeID: "unflattened"}',
      'Delete {type: "View", nativeID: "unflattened"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Delete {type: "View", nativeID: "child"}',
      'Update {type: "View", nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);
  });

  test('scroll view parent is unflattened and view becomes culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    Fantom.runTask(() => {
      root.render(
        <View style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 50}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <View nativeID="unflattened" style={{width: 100, height: 100}}>
          <ScrollView>
            <View
              nativeID={'child'}
              style={{height: 10, width: 10, marginTop: 150}}
            />
          </ScrollView>
        </View>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Remove {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
      'Create {type: "View", nativeID: "unflattened"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Delete {type: "View", nativeID: "child"}',
      'Update {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "unflattened"}',
      'Insert {type: "ScrollView", parentNativeID: "unflattened", index: 0, nativeID: (N/A)}',
    ]);
  });

  test('parent-child flattening with culling', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
              opacity: 0,
            }}>
            <View
              style={{
                marginTop: 50,
                opacity: 0,
              }}>
              <View
                nativeID={'child'}
                style={{height: 10, width: 10, backgroundColor: 'red'}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // force parent-child to be flattened.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
            }}>
            <View
              style={{
                marginTop: 50,
              }}>
              <View
                nativeID={'child'}
                style={{height: 10, width: 10, backgroundColor: 'red'}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    ]);
  });

  test('parent-child flattening with child culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
    const nodeRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          ref={nodeRef}
          contentOffset={{x: 0, y: 50}}>
          <View
            style={{
              marginTop: 100,
              opacity: 0.5,
            }}>
            <View
              style={{
                marginTop: 50,
                opacity: 0.1,
              }}>
              <View
                nativeID={'child'}
                style={{height: 10, width: 10, marginTop: 5}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // force parent-child to be flattened.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          ref={nodeRef}
          contentOffset={{x: 0, y: 50}}>
          <View
            style={{
              marginTop: 100,
            }}>
            <View
              style={{
                marginTop: 50,
              }}>
              <View
                nativeID={'child'}
                style={{height: 10, width: 10, marginTop: 5}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
    ]);
  });

  test('parent-child switching from unflattened-flattened to flattened-unflattened', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
              opacity: 0,
            }}>
            <View
              style={{
                marginTop: 50,
              }}>
              <View
                nativeID={'child'}
                style={{height: 10, width: 10, backgroundColor: 'red'}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // force view to be flattened.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
            }}>
            <View
              style={{
                marginTop: 50,
                opacity: 0,
              }}>
              <View
                nativeID={'child'}
                style={{height: 10, width: 10, backgroundColor: 'red'}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    ]);
  });

  test('unflattening and creating a subtree that is partially culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    // First render with a flattened view container that is visible.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 111}}>
          <View style={{marginTop: 200}} />
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    const nodeRef = React.createRef<HostInstance>();

    // Now update opacity to unflattned the container and add a child that has a culled descendant.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          ref={nodeRef}
          contentOffset={{x: 0, y: 111}}>
          <View
            style={{
              marginTop: 200,
              opacity: 0.5, // Force unflattening
            }}>
            <View
              nativeID="child"
              style={{
                marginTop: 10,
                height: 10,
                width: 10,
              }}>
              <View
                nativeID="grandchild"
                style={{
                  marginTop: 5,
                  height: 5,
                  width: 5,
                }}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Update {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    ]);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    // Scroll down to see the grandchild.
    Fantom.scrollTo(element, {
      x: 0,
      y: 115,
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
    ]);
  });

  test('unflattening and creating a deeper subtree that is partially culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    // First render with a flattened view container that is visible.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 115}}>
          <View style={{marginTop: 200}} />
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    const nodeRef = React.createRef<HostInstance>();

    // Now update opacity to unflattned the container and add a child that has a culled descendant.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          ref={nodeRef}
          contentOffset={{x: 0, y: 115}}>
          <View
            style={{
              marginTop: 200,
              opacity: 0.5, // Force unflattening
            }}>
            <View
              nativeID="child"
              style={{
                marginTop: 10,
                height: 10,
                width: 10,
              }}>
              <View
                nativeID="grandchild"
                style={{
                  marginTop: 5, // 215
                  height: 5,
                  width: 5,
                }}>
                <View
                  nativeID="grandgrandchild"
                  style={{
                    marginTop: 2.5, // 217.5
                    height: 2.5,
                    width: 2.5,
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Update {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
    ]);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    // Scroll down to see the grandchild.
    Fantom.scrollTo(element, {
      x: 0,
      y: 118,
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "grandgrandchild"}',
      'Insert {type: "View", parentNativeID: "grandchild", index: 0, nativeID: "grandgrandchild"}',
    ]);
  });

  test('flattening and deleting a deeper subtree that is partially culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    // First render with a unflattened view container that is visible and a subtree that is partially culled.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 115}}>
          <View style={{marginTop: 200, opacity: 0.5}}>
            <View
              nativeID="child"
              style={{
                marginTop: 10,
                height: 10,
                width: 10,
              }}>
              <View
                nativeID="grandchild"
                style={{
                  marginTop: 5,
                  height: 5,
                  width: 5,
                }}>
                <View
                  nativeID="grandgrandchild"
                  style={{
                    marginTop: 2.5,
                    height: 2.5,
                    width: 2.5,
                  }}
                />
              </View>
            </View>
          </View>
        </ScrollView>,
      );
    });

    // All views are mounted, except for the grandchild.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // Now change opacity to the default to flatten the container and delete container's subtree.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 115}}>
          <View
            style={{
              marginTop: 200,
            }}
          />
        </ScrollView>,
      );
    });

    // Note that the grandchild is not deleted because it was not previously mounted.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Update {type: "View", nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
      'Delete {type: "View", nativeID: "grandchild"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Delete {type: "View", nativeID: "child"}',
    ]);
  });

  test('flattening and deleting a subtree that is partially culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    // First render with a unflattened view container that is visible and a subtree that is partially culled.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 111}}>
          <View style={{marginTop: 200, opacity: 0.5}}>
            <View
              nativeID="child"
              style={{
                marginTop: 10,
                height: 10,
                width: 10,
              }}>
              <View
                nativeID="grandchild"
                style={{
                  marginTop: 5,
                  height: 5,
                  width: 5,
                }}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    // All views are mounted, except for the grandchild.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // Now change opacity to the default to flatten the container and delete container's subtree.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 111}}>
          <View
            style={{
              marginTop: 200,
            }}
          />
        </ScrollView>,
      );
    });

    // Note that the grandchild is not deleted because it was not previously mounted.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Update {type: "View", nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Delete {type: "View", nativeID: "child"}',
    ]);
  });

  test('parent-child switching from unflattened-flattened to flattened-unflattened and grandchild is culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    // First render unflattened view container with flattened child that has a culled grandchild.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
              opacity: 0,
            }}>
            <View
              style={{
                marginTop: 50,
              }}>
              <View
                nativeID={'grandchild'}
                style={{height: 10, width: 10, marginTop: 11}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    // Note that `grandchild` is not mounted.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    const nodeRef = React.createRef<HostInstance>();

    // Now change unflattened view container to flattened and change its child to be unflattened.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          ref={nodeRef}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
            }}>
            <View
              style={{
                marginTop: 50,
                opacity: 0,
              }}>
              <View
                nativeID={'grandchild'}
                style={{height: 10, width: 10, marginTop: 11}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    // Note that `grandchild` is not mounted.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    ]);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    // Scroll to reveal grandchild.
    Fantom.scrollTo(element, {
      x: 0,
      y: 70,
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "grandchild"}',
    ]);
  });

  test('parent-child switching from flattened-unflattened to unflattened-flattened and grandchild is culled', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    // First render unflattened view container with flattened child that has a culled grandchild.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
            }}>
            <View
              style={{
                marginTop: 50,
                opacity: 0,
              }}>
              <View
                nativeID={'grandchild'}
                style={{height: 10, width: 10, marginTop: 11}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    // Note that `grandchild` is not mounted.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    const nodeRef = React.createRef<HostInstance>();

    // Now change unflattened view container to flattened and change its child to be unflattened.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          ref={nodeRef}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
              opacity: 0,
            }}>
            <View
              style={{
                marginTop: 50,
              }}>
              <View
                nativeID={'grandchild'}
                style={{height: 10, width: 10, marginTop: 11}}
              />
            </View>
          </View>
        </ScrollView>,
      );
    });

    // Note that `grandchild` is not mounted.
    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
    ]);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    // Scroll to reveal grandchild.
    Fantom.scrollTo(element, {
      x: 0,
      y: 70,
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "grandchild"}',
    ]);
  });

  test('parent-child switching from flattened-unflattened to unflattened-flattened', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    // First create a view hierarchy where parent is flattened but child is not.
    // `grandchild` is not culled.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
            }}>
            <View
              style={{
                marginTop: 50,
                opacity: 0,
              }}>
              <View nativeID={'grandchild'} style={{height: 10, width: 10}} />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    // Now switch parent to be unflattened and child to be flattened.
    // `grandchild` remains visible.
    Fantom.runTask(() => {
      root.render(
        <ScrollView
          style={{height: 100, width: 100}}
          contentOffset={{x: 0, y: 60}}>
          <View
            style={{
              marginTop: 100,
              opacity: 0,
            }}>
            <View
              style={{
                marginTop: 50,
              }}>
              <View nativeID={'grandchild'} style={{height: 10, width: 10}} />
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "grandchild"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "grandchild"}',
      'Delete {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "grandchild"}',
    ]);
  });

  test('nested scroll view with unflattened wrapper', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});

    Fantom.runTask(() => {
      root.render(
        <ScrollView style={{width: 100, height: 100}}>
          <View>
            <ScrollView
              contentOffset={{x: 15, y: 0}}
              style={{height: 100, width: 100}}
              horizontal={true}>
              <View nativeID="child" style={{width: 10, height: 10}} />
            </ScrollView>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <ScrollView style={{height: 100, width: 100, padding: 1}}>
          <View nativeID="unflattened">
            <ScrollView
              contentOffset={{x: 15, y: 0}}
              style={{height: 100, width: 100}}
              horizontal={true}>
              <View nativeID="child" style={{width: 10, height: 10}} />
            </ScrollView>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Update {type: "View", nativeID: (N/A)}',
      'Remove {type: "ScrollView", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Create {type: "View", nativeID: "unflattened"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "unflattened"}',
      'Insert {type: "ScrollView", parentNativeID: "unflattened", index: 0, nativeID: (N/A)}',
    ]);
  });

  test('reparenting with reparented subtree changing its marginTop', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
    const nodeRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <ScrollView ref={nodeRef} style={{width: 100, height: 100}}>
          <View>
            <View
              style={{
                height: 100,
                width: 100,
              }}
              collapsableChildren={false}>
              <View nativeID="child" style={{width: 10, height: 10}}>
                <View
                  nativeID="grandchild"
                  style={{width: 5, height: 5, marginTop: 5}}
                />
              </View>
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <ScrollView ref={nodeRef} style={{height: 100, width: 100}}>
          <View nativeID="unflattened">
            <View
              style={{
                height: 100,
                width: 100,
                marginTop: 97,
              }}
              collapsableChildren={false}>
              <View nativeID="child" style={{width: 10, height: 10}}>
                <View
                  nativeID="grandchild"
                  style={{width: 5, height: 5, marginTop: 5}}
                />
              </View>
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Update {type: "View", nativeID: (N/A)}',
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Create {type: "View", nativeID: "unflattened"}',
      'Remove {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
      'Delete {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "unflattened"}',
      'Insert {type: "View", parentNativeID: "unflattened", index: 0, nativeID: "child"}',
    ]);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    Fantom.scrollTo(element, {
      x: 0,
      y: 50,
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
    ]);
  });

  test('reparenting deep tree with reparented subtree changing its marginTop', () => {
    const root = Fantom.createRoot({viewportWidth: 100, viewportHeight: 100});
    const nodeRef = React.createRef<HostInstance>();

    Fantom.runTask(() => {
      root.render(
        <ScrollView ref={nodeRef} style={{width: 100, height: 100}}>
          <View>
            <View
              style={{
                height: 100,
                width: 100,
              }}
              collapsableChildren={false}>
              <View nativeID="child" style={{width: 10, height: 10}}>
                <View
                  nativeID="grandchild"
                  style={{width: 5, height: 5, marginTop: 5}}>
                  <View
                    nativeID="grandgrandchild"
                    style={{width: 5, height: 5, marginTop: 5}}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "child"}',
      'Create {type: "View", nativeID: "grandchild"}',
      'Create {type: "View", nativeID: "grandgrandchild"}',
      'Insert {type: "View", parentNativeID: "grandchild", index: 0, nativeID: "grandgrandchild"}',
      'Insert {type: "View", parentNativeID: "child", index: 0, nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: (N/A)}',
      'Insert {type: "ScrollView", parentNativeID: (root), index: 0, nativeID: (N/A)}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <ScrollView ref={nodeRef} style={{height: 100, width: 100}}>
          <View nativeID="unflattened">
            <View
              style={{
                height: 100,
                width: 100,
                marginTop: 94,
              }}
              collapsableChildren={false}>
              <View nativeID="child" style={{width: 10, height: 10}}>
                <View
                  nativeID="grandchild"
                  style={{width: 5, height: 5, marginTop: 5}}>
                  <View
                    nativeID="grandgrandchild"
                    style={{width: 2.5, height: 2.5, marginTop: 2.5}}
                  />
                </View>
              </View>
            </View>
          </View>
        </ScrollView>,
      );
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Update {type: "View", nativeID: (N/A)}',
      'Update {type: "View", nativeID: "child"}',
      'Remove {type: "View", parentNativeID: (N/A), index: 0, nativeID: "child"}',
      'Create {type: "View", nativeID: "unflattened"}',
      'Remove {type: "View", parentNativeID: "grandchild", index: 0, nativeID: "grandgrandchild"}',
      'Delete {type: "View", nativeID: "grandgrandchild"}',
      'Update {type: "View", nativeID: "grandchild"}',
      'Insert {type: "View", parentNativeID: (N/A), index: 0, nativeID: "unflattened"}',
      'Insert {type: "View", parentNativeID: "unflattened", index: 0, nativeID: "child"}',
    ]);

    const element = ensureInstance(nodeRef.current, ReactNativeElement);

    Fantom.scrollTo(element, {
      x: 0,
      y: 50,
    });

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "ScrollView", nativeID: (N/A)}',
      'Create {type: "View", nativeID: "grandgrandchild"}',
      'Insert {type: "View", parentNativeID: "grandchild", index: 0, nativeID: "grandgrandchild"}',
    ]);
  });
});
