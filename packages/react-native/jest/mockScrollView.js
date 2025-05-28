/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import type {ScrollViewNativeProps} from '../Libraries/Components/ScrollView/ScrollViewNativeComponentType';

import View from '../Libraries/Components/View/View';
import requireNativeComponent from '../Libraries/ReactNative/requireNativeComponent';
import * as React from 'react';

const RCTScrollView =
  requireNativeComponent<ScrollViewNativeProps>('RCTScrollView');

export default function mockScrollView(
  BaseComponent: React.ComponentType<{children?: React.Node}>,
): React.ComponentType<{
  ...React.ElementConfig<typeof BaseComponent>,
  refreshControl?: ?React.MixedElement,
}> {
  // $FlowIgnore[incompatible-use]
  return class ScrollViewMock extends BaseComponent {
    render(): React.Node {
      return (
        <RCTScrollView {...this.props}>
          {this.props.refreshControl}
          <View>{this.props.children}</View>
        </RCTScrollView>
      );
    }
  };
}
