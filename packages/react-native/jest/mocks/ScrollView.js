/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import typeof TScrollView from '../../Libraries/Components/ScrollView/ScrollView';
import type {ScrollViewNativeProps} from '../../Libraries/Components/ScrollView/ScrollViewNativeComponentType';
import typeof * as TmockComponent from '../mockComponent';
import typeof * as TMockNativeMethods from '../MockNativeMethods';

import View from '../../Libraries/Components/View/View';
import requireNativeComponent from '../../Libraries/ReactNative/requireNativeComponent';
import * as React from 'react';

const mockComponent =
  jest.requireActual<TmockComponent>('../mockComponent').default;
const MockNativeMethods = jest.requireActual<TMockNativeMethods>(
  '../MockNativeMethods',
).default;

const RCTScrollView =
  requireNativeComponent<ScrollViewNativeProps>('RCTScrollView');

const BaseComponent = mockComponent(
  '../Libraries/Components/ScrollView/ScrollView',
  {
    ...MockNativeMethods,
    getScrollResponder: jest.fn(),
    getScrollableNode: jest.fn(),
    getInnerViewNode: jest.fn(),
    getInnerViewRef: jest.fn(),
    getNativeScrollRef: jest.fn(),
    scrollTo: jest.fn(),
    scrollToEnd: jest.fn(),
    flashScrollIndicators: jest.fn(),
    scrollResponderZoomTo: jest.fn(),
    scrollResponderScrollNativeHandleToKeyboard: jest.fn(),
  }, // instanceMethods
  true, // isESModule
) as TScrollView;

// $FlowFixMe[incompatible-extend]
// $FlowFixMe[invalid-exported-annotation]
export default class ScrollViewMock extends BaseComponent {
  render(): React.Node {
    return (
      <RCTScrollView {...this.props}>
        {this.props.refreshControl}
        <View>{this.props.children}</View>
      </RCTScrollView>
    );
  }
}
