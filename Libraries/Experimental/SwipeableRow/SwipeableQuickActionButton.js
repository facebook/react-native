/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const DeprecatedViewPropTypes = require('DeprecatedViewPropTypes');
const Image = require('Image');
const React = require('React');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');
const View = require('View');

import type {ImageSource} from 'ImageSource';

/**
 * Standard set of quick action buttons that can, if the user chooses, be used
 * with SwipeableListView. Each button takes an image and text with optional
 * formatting.
 */
class SwipeableQuickActionButton extends React.Component<{
  accessibilityLabel?: string,
  imageSource?: ?(ImageSource | number),
  /* $FlowFixMe(>=0.82.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.82 was deployed. To see the error delete this comment
   * and run Flow. */
  imageStyle?: ?DeprecatedViewPropTypes.style,
  mainView?: ?React.Node,
  onPress?: Function,
  /* $FlowFixMe(>=0.82.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.82 was deployed. To see the error delete this comment
   * and run Flow. */
  style?: ?DeprecatedViewPropTypes.style,
  /* $FlowFixMe(>=0.82.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.82 was deployed. To see the error delete this comment
   * and run Flow. */
  containerStyle?: ?DeprecatedViewPropTypes.style,
  testID?: string,
  text?: ?(string | Object | Array<string | Object>),
  /* $FlowFixMe(>=0.82.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.82 was deployed. To see the error delete this comment
   * and run Flow. */
  textStyle?: ?DeprecatedViewPropTypes.style,
}> {
  render(): React.Node {
    if (!this.props.imageSource && !this.props.text && !this.props.mainView) {
      return null;
    }
    const mainView = this.props.mainView ? (
      this.props.mainView
    ) : (
      <View style={this.props.style}>
        <Image
          accessibilityLabel={this.props.accessibilityLabel}
          source={this.props.imageSource}
          style={this.props.imageStyle}
        />
        <Text style={this.props.textStyle}>{this.props.text}</Text>
      </View>
    );
    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        testID={this.props.testID}
        underlayColor="transparent"
        style={this.props.containerStyle}>
        {mainView}
      </TouchableHighlight>
    );
  }
}

module.exports = SwipeableQuickActionButton;
