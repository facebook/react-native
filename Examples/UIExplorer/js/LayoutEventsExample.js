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
 * @providesModule LayoutEventsExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Image,
  LayoutAnimation,
  StyleSheet,
  Text,
  View,
} = ReactNative;

type Layout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type LayoutEvent = {
  nativeEvent: {
    layout: Layout,
  };
};

type State = {
  containerStyle?: { width: number },
  extraText?: string,
  imageLayout?: Layout,
  textLayout?: Layout,
  viewLayout?: Layout,
  viewStyle: { margin: number },
};

class LayoutEventExample extends React.Component {
  state: State = {
    viewStyle: {
      margin: 20,
    },
  };

  animateViewLayout = () => {
    LayoutAnimation.configureNext(
      LayoutAnimation.Presets.spring,
      () => {
        console.log('layout animation done.');
        this.addWrapText();
      }
    );
    this.setState({
      viewStyle: {
        margin: this.state.viewStyle.margin > 20 ? 20 : 60,
      }
    });
  };

  addWrapText = () => {
    this.setState(
      {extraText: '  And a bunch more text to wrap around a few lines.'},
      this.changeContainer
    );
  };

  changeContainer = () => {
    this.setState({containerStyle: {width: 280}});
  };

  onViewLayout = (e: LayoutEvent) => {
    console.log('received view layout event\n', e.nativeEvent);
    this.setState({viewLayout: e.nativeEvent.layout});
  };

  onTextLayout = (e: LayoutEvent) => {
    console.log('received text layout event\n', e.nativeEvent);
    this.setState({textLayout: e.nativeEvent.layout});
  };

  onImageLayout = (e: LayoutEvent) => {
    console.log('received image layout event\n', e.nativeEvent);
    this.setState({imageLayout: e.nativeEvent.layout});
  };

  render() {
    var viewStyle = [styles.view, this.state.viewStyle];
    var textLayout = this.state.textLayout || {width: '?', height: '?'};
    var imageLayout = this.state.imageLayout || {x: '?', y: '?'};
    return (
      <View style={this.state.containerStyle}>
        <Text>
          layout events are called on mount and whenever layout is recalculated. Note that the layout event will typically be received <Text style={styles.italicText}>before</Text> the layout has updated on screen, especially when using layout animations.{'  '}
          <Text style={styles.pressText} onPress={this.animateViewLayout}>
            Press here to change layout.
          </Text>
        </Text>
        <View ref="view" onLayout={this.onViewLayout} style={viewStyle}>
          <Image
            ref="img"
            onLayout={this.onImageLayout}
            style={styles.image}
            source={{uri: 'https://fbcdn-dragon-a.akamaihd.net/hphotos-ak-prn1/t39.1997/p128x128/851561_767334496626293_1958532586_n.png'}}
          />
          <Text>
            ViewLayout: {JSON.stringify(this.state.viewLayout, null, '  ') + '\n\n'}
          </Text>
          <Text ref="txt" onLayout={this.onTextLayout} style={styles.text}>
            A simple piece of text.{this.state.extraText}
          </Text>
          <Text>
            {'\n'}
            Text w/h: {textLayout.width}/{textLayout.height + '\n'}
            Image x/y: {imageLayout.x}/{imageLayout.y}
          </Text>
        </View>
      </View>
    );
  }
}

var styles = StyleSheet.create({
  view: {
    padding: 12,
    borderColor: 'black',
    borderWidth: 0.5,
    backgroundColor: 'transparent',
  },
  text: {
    alignSelf: 'flex-start',
    borderColor: 'rgba(0, 0, 255, 0.2)',
    borderWidth: 0.5,
  },
  image: {
    width: 50,
    height: 50,
    marginBottom: 10,
    alignSelf: 'center',
  },
  pressText: {
    fontWeight: 'bold',
  },
  italicText: {
    fontStyle: 'italic',
  },
});

exports.title = 'Layout Events';
exports.description = 'Examples that show how Layout events can be used to ' +
  'measure view size and position.';
exports.examples = [
{
  title: 'LayoutEventExample',
  render: function(): React.Element<any> {
    return <LayoutEventExample />;
  },
}];
