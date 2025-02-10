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

import View from '../../../../../Libraries/Components/View/View';
import Fantom from '@react-native/fantom';
import * as React from 'react';

import '../../../../../Libraries/Core/InitializeCore';

describe('ViewFlattening', () => {
  /**
   * Test reordering of views with the same parent:
   *
   * For instance:
   *    A -> [B,C,D]  ==> A -> [D,B,C]
   *
   * In the V1 of diffing this would produce 3 removes and 3 inserts, but with
   * some cleverness we can reduce this to 1 remove and 1 insert.
   */
  test('reordering', () => {
    const root = Fantom.createRoot();

    Fantom.runTask(() => {
      root.render(
        <View nativeID="A">
          <View key="B" nativeID="B" />
          <View key="C" nativeID="C" />
          <View key="D" nativeID="D" />
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="A">
        <rn-view nativeID="B" key="0" />
        <rn-view nativeID="C" key="1" />
        <rn-view nativeID="D" key="2" />
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "A"}',
      'Create {type: "View", nativeID: "B"}',
      'Create {type: "View", nativeID: "C"}',
      'Create {type: "View", nativeID: "D"}',
      'Insert {type: "View", parentNativeID: "A", index: 0, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "A", index: 1, nativeID: "C"}',
      'Insert {type: "View", parentNativeID: "A", index: 2, nativeID: "D"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "A"}',
    ]);

    Fantom.runTask(() => {
      root.render(
        <View nativeID="A">
          <View key="D" nativeID="D" />
          <View key="B" nativeID="B" />
          <View key="C" nativeID="C" />
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="A">
        <rn-view key="0" nativeID="D" />
        <rn-view key="1" nativeID="B" />
        <rn-view key="2" nativeID="C" />
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: "A", index: 2, nativeID: "D"}',
      'Insert {type: "View", parentNativeID: "A", index: 0, nativeID: "D"}',
    ]);
  });

  /**
   * Test reparenting mutation instruction generation.
   * We cannot practically handle all possible use-cases here.
   */
  test('view reparenting', () => {
    const root = Fantom.createRoot();

    // Root -> G* -> H -> I -> J -> A* [nodes with * are _not_ flattened]
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View>
            <View>
              <View>
                <View key="A" nativeID="A" />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="A" />
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "RootView", nativeID: (root)}',
      'Create {type: "View", nativeID: "G"}',
      'Create {type: "View", nativeID: "A"}',
      'Insert {type: "View", parentNativeID: "G", index: 0, nativeID: "A"}',
      'Insert {type: "View", parentNativeID: (root), index: 0, nativeID: "G"}',
    ]);

    // Root -> G* -> H* -> I -> J -> A* [nodes with * are _not_ flattened]
    // Force an update with A with new props
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View nativeID="H">
            <View>
              <View>
                <View key="A" nativeID="A" style={{width: 100}} />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="H">
          <rn-view width="100.000000" nativeID="A" />
        </rn-view>
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Update {type: "View", nativeID: "A"}',
      'Remove {type: "View", parentNativeID: "G", index: 0, nativeID: "A"}',
      'Create {type: "View", nativeID: "H"}',
      'Insert {type: "View", parentNativeID: "G", index: 0, nativeID: "H"}',
      'Insert {type: "View", parentNativeID: "H", index: 0, nativeID: "A"}',
    ]);

    // The view is reparented 1 level down with a different sibling
    // Root -> G* -> H* -> I* -> J -> [B*, A*] [nodes with * are _not_ flattened]
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View nativeID="H">
            <View nativeID="I">
              <View>
                <View key="B" nativeID="B" />
                <View key="A" nativeID="A" style={{width: 100}} />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="H">
          <rn-view nativeID="I">
            <rn-view key="0" nativeID="B" />
            <rn-view key="1" nativeID="A" width="100.000000" />
          </rn-view>
        </rn-view>
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: "H", index: 0, nativeID: "A"}',
      'Create {type: "View", nativeID: "I"}',
      'Create {type: "View", nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "H", index: 0, nativeID: "I"}',
      'Insert {type: "View", parentNativeID: "I", index: 0, nativeID: "B"}',
      'Insert {type: "View", parentNativeID: "I", index: 1, nativeID: "A"}',
    ]);

    // The view is reparented 1 level further down with its order with the sibling
    // swapped
    // Root -> G* -> H* -> I* -> J* -> [A*, B*] [nodes with * are _not_ flattened]
    Fantom.runTask(() => {
      root.render(
        <View nativeID="G">
          <View nativeID="H">
            <View nativeID="I">
              <View nativeID="J">
                <View key="A" nativeID="A" style={{width: 100}} />
                <View key="B" nativeID="B" />
              </View>
            </View>
          </View>
        </View>,
      );
    });

    expect(root.getRenderedOutput().toJSX()).toEqual(
      <rn-view nativeID="G">
        <rn-view nativeID="H">
          <rn-view nativeID="I">
            <rn-view nativeID="J">
              <rn-view key="0" nativeID="A" width="100.000000" />
              <rn-view key="1" nativeID="B" />
            </rn-view>
          </rn-view>
        </rn-view>
      </rn-view>,
    );

    expect(root.takeMountingManagerLogs()).toEqual([
      'Remove {type: "View", parentNativeID: "I", index: 1, nativeID: "A"}',
      'Remove {type: "View", parentNativeID: "I", index: 0, nativeID: "B"}',
      'Create {type: "View", nativeID: "J"}',
      'Insert {type: "View", parentNativeID: "I", index: 0, nativeID: "J"}',
      'Insert {type: "View", parentNativeID: "J", index: 0, nativeID: "A"}',
      'Insert {type: "View", parentNativeID: "J", index: 1, nativeID: "B"}',
    ]);
  });
});
