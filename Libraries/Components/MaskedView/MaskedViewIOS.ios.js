/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

import * as React from 'react';
import StyleSheet from '../../StyleSheet/StyleSheet';
import View from '../View/View';

import type {ViewProps} from '../View/ViewPropTypes';
import RCTMaskedViewNativeComponent from './RCTMaskedViewNativeComponent';

type Props = $ReadOnly<{|
  ...ViewProps,

  children: React.Node,
  /**
   * Should be a React element to be rendered and applied as the
   * mask for the child element.
   */
  maskElement: React.Element<any>,
|}>;

/**
 * Renders the child view with a mask specified in the `maskElement` prop.
 *
 * ```
 * import React from 'react';
 * import { MaskedViewIOS, Text, View } from 'react-native';
 *
 * class MyMaskedView extends React.Component {
 *   render() {
 *     return (
 *       <MaskedViewIOS
 *         style={{ flex: 1 }}
 *         maskElement={
 *           <View style={styles.maskContainerStyle}>
 *             <Text style={styles.maskTextStyle}>
 *               Basic Mask
 *             </Text>
 *           </View>
 *         }
 *       >
 *         <View style={{ flex: 1, backgroundColor: 'blue' }} />
 *       </MaskedViewIOS>
 *     );
 *   }
 * }
 * ```
 *
 * The above example will render a view with a blue background that fills its
 * parent, and then mask that view with text that says "Basic Mask".
 *
 * The alpha channel of the view rendered by the `maskElement` prop determines how
 * much of the view's content and background shows through. Fully or partially
 * opaque pixels allow the underlying content to show through but fully
 * transparent pixels block that content.
 *
 */
class MaskedViewIOS extends React.Component<Props> {
  _hasWarnedInvalidRenderMask = false;

  render(): React.Node {
    const {maskElement, children, ...otherViewProps} = this.props;

    if (!React.isValidElement(maskElement)) {
      if (!this._hasWarnedInvalidRenderMask) {
        console.warn(
          'MaskedView: Invalid `maskElement` prop was passed to MaskedView. ' +
            'Expected a React Element. No mask will render.',
        );
        this._hasWarnedInvalidRenderMask = true;
      }
      return <View {...otherViewProps}>{children}</View>;
    }

    return (
      <RCTMaskedViewNativeComponent {...otherViewProps}>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {maskElement}
        </View>
        {children}
      </RCTMaskedViewNativeComponent>
    );
  }
}

module.exports = MaskedViewIOS;
