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
 *
 * @flow
 * @providesModule LayoutExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = ReactNative;

var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

class Circle extends React.Component {
  render() {
    var size = this.props.size || 20;
    var backgroundColor = this.props.bgColor || '#527fe4';
    return (
      <View
        style={{
          borderRadius: size / 2,
          backgroundColor: backgroundColor,
          width: size,
          height: size,
          margin: 1,
        }}
      />
    );
  }
}

class CircleBlock extends React.Component {
  render() {
    var circleStyle = {
      flexDirection: 'row',
      backgroundColor: '#f6f7f8',
      borderWidth: 0.5,
      borderColor: '#d6d7da',
      marginBottom: 2,
    };
    return (
      <View style={[circleStyle, this.props.style]}>
        {this.props.children}
      </View>
    );
  }
}

class LayoutExample extends React.Component {
  static title = 'Layout - Flexbox';
  static description = 'Examples of using the flexbox API to layout views.';
  static displayName = 'LayoutExample';

  render() {
    var fiveColoredCircles = [
      <Circle bgColor="#527fe4" key="blue" />,
      <Circle bgColor="#D443E3" key="violet" />,
      <Circle bgColor="#FF9049" key="orange" />,
      <Circle bgColor="#FFE649" key="yellow" />,
      <Circle bgColor="#7FE040" key="green" />
    ];

    return (
      <UIExplorerPage title={this.props.navigator ? null : 'Layout'}>
        <UIExplorerBlock title="Flex Direction">
          <Text>row</Text>
          <CircleBlock style={{flexDirection: 'row'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>row-reverse</Text>
          <CircleBlock style={{flexDirection: 'row-reverse'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>column</Text>
          <CircleBlock style={{flexDirection: 'column'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>column-reverse</Text>
          <CircleBlock style={{flexDirection: 'column-reverse'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <View style={[styles.overlay, {position: 'absolute', top: 15, left: 160}]}>
            <Text>{'top: 15, left: 160'}</Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Justify Content - Main Direction">
          <Text>flex-start</Text>
          <CircleBlock style={{justifyContent: 'flex-start'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>center</Text>
          <CircleBlock style={{justifyContent: 'center'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>flex-end</Text>
          <CircleBlock style={{justifyContent: 'flex-end'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>space-between</Text>
          <CircleBlock style={{justifyContent: 'space-between'}}>
            {fiveColoredCircles}
          </CircleBlock>
          <Text>space-around</Text>
          <CircleBlock style={{justifyContent: 'space-around'}}>
            {fiveColoredCircles}
          </CircleBlock>
        </UIExplorerBlock>
        <UIExplorerBlock title="Align Items - Other Direction">
          <Text>flex-start</Text>
          <CircleBlock style={{alignItems: 'flex-start', height: 30}}>
            <Circle size={15} /><Circle size={10} /><Circle size={20} />
            <Circle size={17} /><Circle size={12} /><Circle size={15} />
            <Circle size={10} /><Circle size={20} /><Circle size={17} />
            <Circle size={12} /><Circle size={15} /><Circle size={10} />
            <Circle size={20} /><Circle size={17} /><Circle size={12} />
            <Circle size={15} /><Circle size={8} />
          </CircleBlock>
          <Text>center</Text>
          <CircleBlock style={{alignItems: 'center', height: 30}}>
            <Circle size={15} /><Circle size={10} /><Circle size={20} />
            <Circle size={17} /><Circle size={12} /><Circle size={15} />
            <Circle size={10} /><Circle size={20} /><Circle size={17} />
            <Circle size={12} /><Circle size={15} /><Circle size={10} />
            <Circle size={20} /><Circle size={17} /><Circle size={12} />
            <Circle size={15} /><Circle size={8} />
          </CircleBlock>
          <Text>flex-end</Text>
          <CircleBlock style={{alignItems: 'flex-end', height: 30}}>
            <Circle size={15} /><Circle size={10} /><Circle size={20} />
            <Circle size={17} /><Circle size={12} /><Circle size={15} />
            <Circle size={10} /><Circle size={20} /><Circle size={17} />
            <Circle size={12} /><Circle size={15} /><Circle size={10} />
            <Circle size={20} /><Circle size={17} /><Circle size={12} />
            <Circle size={15} /><Circle size={8} />
          </CircleBlock>
        </UIExplorerBlock>
        <UIExplorerBlock title="Flex Wrap">
          <CircleBlock style={{flexWrap: 'wrap'}}>
            {'oooooooooooooooo'.split('').map((char, i) => <Circle key={i} />)}
          </CircleBlock>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  }
}

var styles = StyleSheet.create({
  overlay: {
    backgroundColor: '#aaccff',
    borderRadius: 10,
    borderWidth: 0.5,
    opacity: 0.5,
    padding: 5,
  },
});

module.exports = LayoutExample;
