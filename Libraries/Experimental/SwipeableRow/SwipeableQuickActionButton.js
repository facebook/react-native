/**
 * Copyright (c) 2013-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * The examples provided by Facebook are for non-commercial testing and
 * evaluation purposes only.
 *
 * Facebook reserves all rights not expressly granted.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NON INFRINGEMENT. IN NO EVENT SHALL
 * FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN
 * AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.  *
 *
 * @providesModule SwipeableQuickActionButton
 * @flow
 */
'use strict';

const Image = require('Image');
const React = require('React');
const Text = require('Text');
const TouchableHighlight = require('TouchableHighlight');
const View = require('View');

const {PropTypes} = React;

/**
 * Standard set of quick action buttons that can, if the user chooses, be used
 * with SwipeableListView. Each button takes an image and text with optional
 * formatting.
 */
const SwipeableQuickActionButton = React.createClass({
  propTypes: {
    accessibilityLabel: PropTypes.string,
    imageSource: Image.propTypes.source.isRequired,
    imageStyle: Image.propTypes.style,
    onPress: PropTypes.func,
    style: View.propTypes.style,
    testID: PropTypes.string,
    text: PropTypes.string,
    textStyle: Text.propTypes.style,
  },

  render(): ?ReactElement<any> {
    if (!this.props.imageSource && !this.props.text) {
      return null;
    }

    return (
      <TouchableHighlight
        onPress={this.props.onPress}
        testID={this.props.testID}
        underlayColor="transparent">
        <View style={this.props.style}>
          <Image
            accessibilityLabel={this.props.accessibilityLabel}
            source={this.props.imageSource}
            style={this.props.imageStyle}
          />
          <Text style={this.props.textStyle}>
            {this.props.text}
          </Text>
        </View>
      </TouchableHighlight>
    );
  },
});

module.exports = SwipeableQuickActionButton;
