/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MaskedViewIOS
 * @flow
 */

const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');
const ViewPropTypes = require('ViewPropTypes');
const findNodeHandle = require('ReactNative').findNodeHandle;
const requireNativeComponent = require('requireNativeComponent');
const cloneReferencedElement = require('react-clone-referenced-element');
const ReactPropTypes = React.PropTypes;

import type { ViewProps } from 'ViewPropTypes';

type Props = ViewProps & {
  /**
   * Only a single child is supported.
   */
  children: React.Element<*>,
  /**
   * Should return a React element to be rendered and applied as the
   * mask for the child element.
   */
  renderMask: () => React.Element<*>,
};

type State = {
  maskViewNodeRef: ?mixed,
};

/**
 * Renders the child view with a mask specified in the `renderMask` prop.
 *
 * ```
 * import React from 'react';
 * import { MaskedView, Text, View } from 'react-native';
 *
 * class MyMaskedView extends React.Component {
 *   render() {
 *     return (
 *       <MaskedView
 *         style={{ flex: 1 }}
 *         renderMask={() =>
 *           <View style={styles.maskContainerStyle}>
 *             <Text style={styles.maskTextStyle}>
 *               Basic Mask
 *             </Text>
 *           </View>
 *         }
 *       >
 *         <View style={{ flex: 1, backgroundColor: 'blue' }} />
 *       </MaskedView>
 *     );
 *   }
 * }
 * ```
 *
 * The above example will render a view with a blue background that fills its
 * parent, and then mask that view with text that says "Basic Mask".
 *
 * The alpha channel of the view rendered by the `renderMask` prop determines how
 * much of the view’s content and background shows through. Fully or partially
 * opaque pixels allow the underlying content to show through but fully
 * transparent pixels block that content.
 *
 */
class MaskedViewIOS extends React.Component {
  props: Props;

  state: State = {
    maskViewNodeRef: null,
  };

  static propTypes = {
    ...ViewPropTypes,
    renderMask: ReactPropTypes.func.isRequired,
  };

  _hasWarnedInvalidChildren = false;
  _hasWarnedInvalidRenderMask = false;
  _maskViewNodeHandle: ?number = null;

  componentWillUpdate(nextProps: Props, nextState: State) {
    if (nextState.maskViewNodeRef !== this.state.maskViewNodeRef) {
      this._maskViewNodeHandle = findNodeHandle(nextState.maskViewNodeRef);
    }
  }

  render() {
    if (!this.props.children || React.Children.count(this.props.children) > 1) {
      if (!this._hasWarnedInvalidChildren) {
        console.warn(
          'MaskedView: MaskedView requires a single child React Element.'
        );
        this._hasWarnedInvalidChildren = true;
      }
      return null;
    }

    const target = React.Children.only(this.props.children);

    if (typeof this.props.renderMask !== 'function') {
      if (!this._hasWarnedInvalidRenderMask) {
        console.warn(
          'MaskedView: Invalid `renderMask` prop was passed to MaskedView. ' +
            'Expected a function. No mask will render.'
        );
        this._hasWarnedInvalidRenderMask = true;
      }
      return <View style={this.props.style}>{target}</View>;
    }

    const maskElement = this.props.renderMask();
    let maskElementWithRef = null;
    if (maskElement) {
      maskElementWithRef = cloneReferencedElement(maskElement, {
        ref: this._handleMaskViewRef,
      });
    }

    return (
      <RCTMaskedView
        style={this.props.style}
        maskRef={this._maskViewNodeHandle}>
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { opacity: 0 }]}>
          {maskElementWithRef}
        </View>
        {target}
      </RCTMaskedView>
    );
  }

  _handleMaskViewRef = (node: React.Element<*>) => {
    if (!node) {
      return;
    }
    if (this.state.maskViewNodeRef !== node) {
      this.setState({ maskViewNodeRef: node });
    }
  };
}

const RCTMaskedView = requireNativeComponent(
  'RCTMaskedView',
  {
    name: 'RCTMaskedView',
    displayName: 'RCTMaskedView',
    propTypes: {
      maskRef: ReactPropTypes.number,
    },
  },
  {
    nativeOnly: {
      maskRef: true,
    },
  }
);

module.exports = MaskedViewIOS;
