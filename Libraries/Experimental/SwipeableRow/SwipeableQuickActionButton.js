/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */

'use strict';

const Image = require('Image');
const React = require('React');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');
const View = require('View');
const ViewPropTypes = require('ViewPropTypes');

import type {ImageSource} from 'ImageSource';

/**
 * Standard set of quick action buttons that can, if the user chooses, be used
 * with SwipeableListView. Each button takes an image and text with optional
 * formatting.
 */
class SwipeableQuickActionButton extends React.Component<{
  accessibilityLabel?: string,
  imageSource?: ?(ImageSource | number),
  imageStyle?: ?ViewPropTypes.style,
  mainView?: ?React.Node,
  onPress?: Function,
  style?: ?ViewPropTypes.style,
  testID?: string,
  text?: ?(string | Object | Array<string | Object>),
  textStyle?: ?ViewPropTypes.style,
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
        underlayColor="transparent">
        <View style={this.props.style}>{mainView}</View>
      </TouchableHighlight>
    );
  }
}

module.exports = SwipeableQuickActionButton;
