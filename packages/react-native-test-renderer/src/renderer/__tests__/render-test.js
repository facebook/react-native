/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

import * as ReactNativeTestRenderer from '../index';
import * as React from 'react';
import {Text, View} from 'react-native';
import 'react-native/Libraries/Components/View/ViewNativeComponent';

function TestComponent() {
  return (
    <View>
      <Text>Hello</Text>
      <View />
    </View>
  );
}

function TestComponentWithProps() {
  return (
    <View pointerEvents="box-none">
      <Text>Hello</Text>
      <View style={{flex: 1}} />
    </View>
  );
}

describe('render', () => {
  describe('toJSON', () => {
    it('returns expected JSON output based on renderer component', () => {
      const result = ReactNativeTestRenderer.render(<TestComponent />);
      expect(result.toJSON()).toMatchSnapshot();
    });

    it('renders View props', () => {
      const result = ReactNativeTestRenderer.render(<TestComponentWithProps />);
      expect(result.toJSON()).toMatchSnapshot();
    });
  });

  describe('findAll', () => {
    it('returns all nodes matching the predicate', () => {
      const result = ReactNativeTestRenderer.render(<TestComponent />);
      const textNode = result.findAll(node => {
        return node.props?.text === 'Hello';
      })[0];
      expect(textNode).not.toBeUndefined();

      const viewNodes = result.findAll(node => {
        return node.viewName === 'RCTView';
      });
      expect(viewNodes.length).toBe(2);
    });
  });
});
