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
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Dimensions,
  View,
  Text
} = ReactNative;

class DimensionsExample extends React.Component {
  constructor() {
    super();

    this.state = Dimensions.get('window');
    this.dimensionSubscription = null;
  }

  componentWillMount() {
    this.dimensionSubscription = Dimensions.addEventListener('change', dimensions => {
      this.setState(dimensions.window);
    });
  }

  componentWillUnmount() {
    this.dimensionSubscription.remove();
  }

  render() {
    const { width, height, scale, iosSizeClassHorizontal, iosSizeClassVertical } = this.state;

    return (
      <View>
        <Text>Width: {width}</Text>
        <Text>Height: {height}</Text>
        <Text>Scale: {scale}</Text>
        <Text>Size class horizontal: {iosSizeClassHorizontal}</Text>
        <Text>Size class vertical: {iosSizeClassVertical}</Text>
      </View>
    );
  }
}


exports.title = 'Dimensions Example';
exports.description = 'Demonstrates device dimensions.';
exports.examples = [
  {
    title: 'Dimensions',
    description: 'Shows current dimensions of device',
    render() {
      return <DimensionsExample />;
    }
  },
];
