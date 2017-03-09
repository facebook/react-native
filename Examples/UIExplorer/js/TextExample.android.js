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
 * @providesModule TextExample
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  Image,
  StyleSheet,
  Text,
  View,
} = ReactNative;
var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

class Entity extends React.Component {
  render() {
    return (
      <Text style={{fontWeight: 'bold', color: '#527fe4'}}>
        {this.props.children}
      </Text>
    );
  }
}

class AttributeToggler extends React.Component {
  state = {fontWeight: 'bold', fontSize: 15};

  toggleWeight = () => {
    this.setState({
      fontWeight: this.state.fontWeight === 'bold' ? 'normal' : 'bold'
    });
  };

  increaseSize = () => {
    this.setState({
      fontSize: this.state.fontSize + 1
    });
  };

  render() {
    var curStyle = {fontWeight: this.state.fontWeight, fontSize: this.state.fontSize};
    return (
      <View>
        <Text style={curStyle}>
          Tap the controls below to change attributes.
        </Text>
        <Text>
          <Text>See how it will even work on <Text style={curStyle}>this nested text</Text></Text>
        </Text>
        <Text>
          <Text onPress={this.toggleWeight}>Toggle Weight</Text>
          {' (with highlight onPress)'}
        </Text>
        <Text onPress={this.increaseSize} suppressHighlighting={true}>
          Increase Size (suppressHighlighting true)
        </Text>
      </View>
    );
  }
}

class TextExample extends React.Component {
  static title = '<Text>';
  static description = 'Base component for rendering styled text.';

  render() {
    return (
      <UIExplorerPage title="<Text>">
        <UIExplorerBlock title="Wrap">
          <Text>
            The text should wrap if it goes on multiple lines.
            See, this is going to the next line.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Padding">
          <Text style={{padding: 10}}>
            This text is indented by 10px padding on all sides.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Font Family">
          <Text style={{fontFamily: 'sans-serif'}}>
            Sans-Serif
          </Text>
          <Text style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
            Sans-Serif Bold
          </Text>
          <Text style={{fontFamily: 'serif'}}>
            Serif
          </Text>
          <Text style={{fontFamily: 'serif', fontWeight: 'bold'}}>
            Serif Bold
          </Text>
          <Text style={{fontFamily: 'monospace'}}>
            Monospace
          </Text>
          <Text style={{fontFamily: 'monospace', fontWeight: 'bold'}}>
            Monospace Bold (After 5.0)
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Android Material Design fonts">
          <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <View style={{flex: 1}}>
              <Text style={{fontFamily: 'sans-serif'}}>
                Roboto Regular
              </Text>
              <Text style={{fontFamily: 'sans-serif', fontStyle: 'italic'}}>
                Roboto Italic
              </Text>
              <Text style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}>
                Roboto Bold
              </Text>
              <Text style={{fontFamily: 'sans-serif', fontStyle: 'italic', fontWeight: 'bold'}}>
                Roboto Bold Italic
              </Text>
              <Text style={{fontFamily: 'sans-serif-light'}}>
                Roboto Light
              </Text>
              <Text style={{fontFamily: 'sans-serif-light', fontStyle: 'italic'}}>
                Roboto Light Italic
              </Text>
              <Text style={{fontFamily: 'sans-serif-thin'}}>
                Roboto Thin (After 4.2)
              </Text>
              <Text style={{fontFamily: 'sans-serif-thin', fontStyle: 'italic'}}>
                Roboto Thin Italic (After 4.2)
              </Text>
              <Text style={{fontFamily: 'sans-serif-condensed'}}>
                Roboto Condensed
              </Text>
              <Text style={{fontFamily: 'sans-serif-condensed', fontStyle: 'italic'}}>
                Roboto Condensed Italic
              </Text>
              <Text style={{fontFamily: 'sans-serif-condensed', fontWeight: 'bold'}}>
                Roboto Condensed Bold
              </Text>
              <Text style={{
                  fontFamily: 'sans-serif-condensed',
                  fontStyle: 'italic',
                  fontWeight: 'bold'}}>
                Roboto Condensed Bold Italic
              </Text>
              <Text style={{fontFamily: 'sans-serif-medium'}}>
                Roboto Medium (After 5.0)
              </Text>
              <Text style={{fontFamily: 'sans-serif-medium', fontStyle: 'italic'}}>
                Roboto Medium Italic (After 5.0)
              </Text>
            </View>
          </View>
        </UIExplorerBlock>
        <UIExplorerBlock title="Custom Fonts">
          <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <View style={{flex: 1}}>
              <Text style={{fontFamily: 'notoserif'}}>
                NotoSerif Regular
              </Text>
              <Text style={{fontFamily: 'notoserif', fontStyle: 'italic', fontWeight: 'bold'}}>
                NotoSerif Bold Italic
              </Text>
              <Text style={{fontFamily: 'notoserif', fontStyle: 'italic'}}>
                NotoSerif Italic (Missing Font file)
              </Text>
            </View>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Font Size">
          <Text style={{fontSize: 23}}>
            Size 23
          </Text>
          <Text style={{fontSize: 8}}>
            Size 8
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Color">
          <Text style={{color: 'red'}}>
            Red color
          </Text>
          <Text style={{color: 'blue'}}>
            Blue color
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Font Weight">
          <Text style={{fontWeight: 'bold'}}>
            Move fast and be bold
          </Text>
          <Text style={{fontWeight: 'normal'}}>
            Move fast and be bold
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Font Style">
          <Text style={{fontStyle: 'italic'}}>
            Move fast and be bold
          </Text>
          <Text style={{fontStyle: 'normal'}}>
            Move fast and be bold
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Font Style and Weight">
          <Text style={{fontStyle: 'italic', fontWeight: 'bold'}}>
            Move fast and be bold
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Text Decoration">
          <Text style={{textDecorationLine: 'underline'}}>
            Solid underline
          </Text>
          <Text style={{textDecorationLine: 'none'}}>
            None textDecoration
          </Text>
          <Text style={{textDecorationLine: 'line-through', textDecorationStyle: 'solid'}}>
            Solid line-through
          </Text>
          <Text style={{textDecorationLine: 'underline line-through'}}>
            Both underline and line-through
          </Text>
          <Text>
            Mixed text with <Text style={{textDecorationLine: 'underline'}}>underline</Text> and <Text style={{textDecorationLine: 'line-through'}}>line-through</Text> text nodes
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Nested">
          <Text onPress={() => console.log('1st')}>
            (Normal text,
            <Text style={{fontWeight: 'bold'}} onPress={() => console.log('2nd')}>
              (and bold
              <Text style={{fontStyle: 'italic', fontSize: 11, color: '#527fe4'}} onPress={() => console.log('3rd')}>
                (and tiny bold italic blue
                <Text style={{fontWeight: 'normal', fontStyle: 'normal'}} onPress={() => console.log('4th')}>
                  (and tiny normal blue)
                </Text>
                )
              </Text>
              )
            </Text>
            )
          </Text>
          <Text style={{fontFamily: 'serif'}} onPress={() => console.log('1st')}>
            (Serif
            <Text style={{fontStyle: 'italic', fontWeight: 'bold'}} onPress={() => console.log('2nd')}>
              (Serif Bold Italic
              <Text
                style={{fontFamily: 'monospace', fontStyle: 'normal', fontWeight: 'normal'}}
                onPress={() => console.log('3rd')}>
                (Monospace Normal
                <Text
                  style={{fontFamily: 'sans-serif', fontWeight: 'bold'}}
                  onPress={() => console.log('4th')}>
                  (Sans-Serif Bold
                  <Text style={{fontWeight: 'normal'}} onPress={() => console.log('5th')}>
                    (and Sans-Serif Normal)
                  </Text>
                  )
                </Text>
                )
              </Text>
              )
            </Text>
            )
          </Text>
          <Text style={{fontSize: 12}}>
            <Entity>Entity Name</Entity>
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Text Align">
          <Text>
            auto (default) - english LTR
          </Text>
          <Text>
            أحب اللغة العربية auto (default) - arabic RTL
          </Text>
          <Text style={{textAlign: 'left'}}>
            left left left left left left left left left left left left left left left
          </Text>
          <Text style={{textAlign: 'center'}}>
            center center center center center center center center center center center
          </Text>
          <Text style={{textAlign: 'right'}}>
            right right right right right right right right right right right right right
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Unicode">
          <View>
            <View style={{flexDirection: 'row'}}>
              <Text style={{backgroundColor: 'red'}}>
                星际争霸是世界上最好的游戏。
              </Text>
            </View>
            <View>
              <Text style={{backgroundColor: 'red'}}>
                星际争霸是世界上最好的游戏。
              </Text>
            </View>
            <View style={{alignItems: 'center'}}>
              <Text style={{backgroundColor: 'red'}}>
                星际争霸是世界上最好的游戏。
              </Text>
            </View>
            <View>
              <Text style={{backgroundColor: 'red'}}>
                星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。
              </Text>
            </View>
          </View>
        </UIExplorerBlock>
        <UIExplorerBlock title="Spaces">
          <Text>
            A {'generated'} {' '} {'string'} and    some &nbsp;&nbsp;&nbsp; spaces
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Line Height">
          <Text style={{lineHeight: 35}}>
            Holisticly formulate inexpensive ideas before best-of-breed benefits. <Text style={{fontSize: 20}}>Continually</Text> expedite magnetic potentialities rather than client-focused interfaces.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Empty Text">
          <Text />
        </UIExplorerBlock>
        <UIExplorerBlock title="Toggling Attributes">
          <AttributeToggler />
        </UIExplorerBlock>
        <UIExplorerBlock title="backgroundColor attribute">
          <Text style={{backgroundColor: '#ffaaaa'}}>
            Red background,
            <Text style={{backgroundColor: '#aaaaff'}}>
              {' '}blue background,
              <Text>
                {' '}inherited blue background,
                <Text style={{backgroundColor: '#aaffaa'}}>
                  {' '}nested green background.
                </Text>
              </Text>
            </Text>
          </Text>
          <Text style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
            Same alpha as background,
            <Text>
              Inherited alpha from background,
              <Text style={{backgroundColor: 'rgba(100, 100, 100, 0.3)'}}>
                Reapply alpha
              </Text>
            </Text>
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="containerBackgroundColor attribute">
          <View style={{flexDirection: 'row', height: 85}}>
            <View style={{backgroundColor: '#ffaaaa', width: 150}} />
            <View style={{backgroundColor: '#aaaaff', width: 150}} />
          </View>
          <Text style={[styles.backgroundColorText, {top: -80}]}>
            Default containerBackgroundColor (inherited) + backgroundColor wash
          </Text>
          <Text style={[styles.backgroundColorText, {top: -70, backgroundColor: 'transparent'}]}>
            {"containerBackgroundColor: 'transparent' + backgroundColor wash"}
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="numberOfLines attribute">
          <Text numberOfLines={1}>
            Maximum of one line no matter now much I write here. If I keep writing it{"'"}ll just truncate after one line
          </Text>
          <Text numberOfLines={2} style={{marginTop: 20}}>
            Maximum of two lines no matter now much I write here. If I keep writing it{"'"}ll just truncate after two lines
          </Text>
          <Text style={{marginTop: 20}}>
            No maximum lines specified no matter now much I write here. If I keep writing it{"'"}ll just keep going and going
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="selectable attribute">
          <Text selectable>
            This text is selectable if you click-and-hold, and will offer the native Android selection menus.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="selectionColor attribute">
          <Text selectable selectionColor="orange">
            This text will have a orange highlight on selection.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Inline images">
          <Text>
            This text contains an inline image <Image source={require('./flux.png')}/>. Neat, huh?
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Text shadow">
          <Text style={{fontSize: 20, textShadowOffset: {width: 2, height: 2}, textShadowRadius: 1, textShadowColor: '#00cccc'}}>
            Demo text shadow
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Ellipsize mode">
          <Text numberOfLines={1}>
            This very long text should be truncated with dots in the end.
          </Text>
          <Text ellipsizeMode="middle" numberOfLines={1}>
            This very long text should be truncated with dots in the middle.
          </Text>
          <Text ellipsizeMode="head" numberOfLines={1}>
            This very long text should be truncated with dots in the beginning.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Include Font Padding">
          <View style={{flexDirection: 'row', justifyContent: 'space-around', marginBottom: 10}}>
            <View style={{alignItems: 'center'}}>
              <Text style={styles.includeFontPaddingText}>
                Ey
              </Text>
              <Text>Default</Text>
            </View>
            <View style={{alignItems: 'center'}}>
              <Text style={[styles.includeFontPaddingText, {includeFontPadding: false, marginLeft: 10}]}>
                Ey
              </Text>
              <Text>includeFontPadding: false</Text>
            </View>
          </View>
          <Text>By default Android will put extra space above text to allow for upper-case accents or other ascenders. With some fonts, this can make text look slightly misaligned when centered vertically.</Text>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  }
}

var styles = StyleSheet.create({
  backgroundColorText: {
    left: 5,
    backgroundColor: 'rgba(100, 100, 100, 0.3)'
  },
  includeFontPaddingText: {
    fontSize: 120,
    fontFamily: 'sans-serif',
    backgroundColor: '#EEEEEE',
    color: '#000000',
    textAlignVertical: 'center',
    alignSelf: 'center',
  }
});

module.exports = TextExample;
