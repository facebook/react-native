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

const Platform = require('Platform');
var React = require('react');
var ReactNative = require('react-native');
var {
  Image,
  StyleSheet,
  Text,
  View,
  LayoutAnimation,
} = ReactNative;

class Entity extends React.Component {
  render() {
    return (
      <Text style={{fontWeight: '500', color: '#527fe4'}}>
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
        <Text
          style={{backgroundColor: '#ffaaaa', marginTop: 5}}
          onPress={this.toggleWeight}>
          Toggle Weight
        </Text>
        <Text
          style={{backgroundColor: '#aaaaff', marginTop: 5}}
          onPress={this.increaseSize}>
          Increase Size
        </Text>
      </View>
    );
  }
}

var AdjustingFontSize = React.createClass({
  getInitialState: function() {
    return {dynamicText:'', shouldRender: true,};
  },
  reset: function() {
    LayoutAnimation.easeInEaseOut();
    this.setState({
      shouldRender: false,
    });
    setTimeout(()=>{
      LayoutAnimation.easeInEaseOut();
      this.setState({
        dynamicText: '',
        shouldRender: true,
      });
    }, 300);
  },
  addText: function() {
    this.setState({
      dynamicText: this.state.dynamicText + (Math.floor((Math.random() * 10) % 2) ? ' foo' : ' bar'),
    });
  },
  removeText: function() {
    this.setState({
      dynamicText: this.state.dynamicText.slice(0, this.state.dynamicText.length - 4),
    });
  },
  render: function() {

    if (!this.state.shouldRender) {
      return (<View/>);
    }
    return (
      <View>
        <Text lineBreakMode="tail" numberOfLines={1} style={{fontSize: 36, marginVertical:6}}>
          Truncated text is baaaaad.
        </Text>
        <Text numberOfLines={1} adjustsFontSizeToFit={true} style={{fontSize: 40, marginVertical:6}}>
          Shrinking to fit available space is much better!
        </Text>

        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{fontSize:30, marginVertical:6}}>
        {'Add text to me to watch me shrink!' + ' ' + this.state.dynamicText}
        </Text>

        <Text adjustsFontSizeToFit={true} numberOfLines={4} style={{fontSize:20, marginVertical:6}}>
        {'Multiline text component shrinking is supported, watch as this reeeeaaaally loooooong teeeeeeext grooooows and then shriiiinks as you add text to me! ioahsdia soady auydoa aoisyd aosdy ' + ' ' + this.state.dynamicText}
        </Text>

        <Text adjustsFontSizeToFit={true} numberOfLines={1} style={{marginVertical:6}}>
          <Text style={{fontSize:14}}>
            {'Differently sized nested elements will shrink together. '}
          </Text>
          <Text style={{fontSize:20}}>
            {'LARGE TEXT! ' + this.state.dynamicText}
          </Text>
        </Text>

        <View style={{flexDirection:'row', justifyContent:'space-around', marginTop: 5, marginVertical:6}}>
          <Text
            style={{backgroundColor: '#ffaaaa'}}
            onPress={this.reset}>
            Reset
          </Text>
          <Text
            style={{backgroundColor: '#aaaaff'}}
            onPress={this.removeText}>
            Remove Text
          </Text>
          <Text
            style={{backgroundColor: '#aaffaa'}}
            onPress={this.addText}>
            Add Text
          </Text>
        </View>
      </View>
    );
  }
});

exports.title = '<Text>';
exports.description = 'Base component for rendering styled text.';
exports.displayName = 'TextExample';
exports.examples = [
{
  title: 'Wrap',
  render: function() {
    return (
      <Text>
        The text should wrap if it goes on multiple lines. See, this is going to
        the next line.
      </Text>
    );
  },
}, {
  title: 'Padding',
  render: function() {
    return (
      <Text style={{padding: 10}}>
        This text is indented by 10px padding on all sides.
      </Text>
    );
  },
}, {
  title: 'Font Family',
  render: function() {
    return (
      <View>
        <Text style={{fontFamily: (Platform.isTVOS ? 'Times' : 'Cochin')}}>
          Cochin
        </Text>
        <Text style={{fontFamily: (Platform.isTVOS ? 'Times' : 'Cochin'), fontWeight: 'bold'}}>
          Cochin bold
        </Text>
        <Text style={{fontFamily: 'Helvetica'}}>
          Helvetica
        </Text>
        <Text style={{fontFamily: 'Helvetica', fontWeight: 'bold'}}>
          Helvetica bold
        </Text>
        <Text style={{fontFamily: (Platform.isTVOS ? 'Courier' : 'Verdana')}}>
          Verdana
        </Text>
        <Text style={{fontFamily: (Platform.isTVOS ? 'Courier' : 'Verdana'), fontWeight: 'bold'}}>
          Verdana bold
        </Text>
      </View>
    );
  },
}, {
  title: 'Font Size',
  render: function() {
    return (
      <View>
        <Text style={{fontSize: 23}}>
          Size 23
        </Text>
        <Text style={{fontSize: 8}}>
          Size 8
        </Text>
      </View>
    );
  },
}, {
  title: 'Color',
  render: function() {
    return (
      <View>
        <Text style={{color: 'red'}}>
          Red color
        </Text>
        <Text style={{color: 'blue'}}>
          Blue color
        </Text>
      </View>
    );
  },
}, {
  title: 'Font Weight',
  render: function() {
    return (
      <View>
        <Text style={{fontSize: 20, fontWeight: '100'}}>
          Move fast and be ultralight
        </Text>
        <Text style={{fontSize: 20, fontWeight: '200'}}>
          Move fast and be light
        </Text>
        <Text style={{fontSize: 20, fontWeight: 'normal'}}>
          Move fast and be normal
        </Text>
        <Text style={{fontSize: 20, fontWeight: 'bold'}}>
          Move fast and be bold
        </Text>
        <Text style={{fontSize: 20, fontWeight: '900'}}>
          Move fast and be ultrabold
        </Text>
      </View>
    );
  },
},  {
  title: 'Font Style',
  render: function() {
    return (
      <View>
        <Text style={{fontStyle: 'normal'}}>
          Normal text
        </Text>
        <Text style={{fontStyle: 'italic'}}>
          Italic text
        </Text>
      </View>
    );
  },
}, {
  title: 'Selectable',
  render: function() {
    return (
      <View>
        <Text selectable={true}>
          This text is <Text style={{fontWeight: 'bold'}}>selectable</Text> if you click-and-hold.
        </Text>
      </View>
    );
  },
}, {
  title: 'Text Decoration',
  render: function() {
    return (
      <View>
        <Text style={{textDecorationLine: 'underline', textDecorationStyle: 'solid'}}>
          Solid underline
        </Text>
        <Text style={{textDecorationLine: 'underline', textDecorationStyle: 'double', textDecorationColor: '#ff0000'}}>
          Double underline with custom color
        </Text>
        <Text style={{textDecorationLine: 'underline', textDecorationStyle: 'dashed', textDecorationColor: '#9CDC40'}}>
          Dashed underline with custom color
        </Text>
        <Text style={{textDecorationLine: 'underline', textDecorationStyle: 'dotted', textDecorationColor: 'blue'}}>
          Dotted underline with custom color
        </Text>
        <Text style={{textDecorationLine: 'none'}}>
          None textDecoration
        </Text>
        <Text style={{textDecorationLine: 'line-through', textDecorationStyle: 'solid'}}>
          Solid line-through
        </Text>
        <Text style={{textDecorationLine: 'line-through', textDecorationStyle: 'double', textDecorationColor: '#ff0000'}}>
          Double line-through with custom color
        </Text>
        <Text style={{textDecorationLine: 'line-through', textDecorationStyle: 'dashed', textDecorationColor: '#9CDC40'}}>
          Dashed line-through with custom color
        </Text>
        <Text style={{textDecorationLine: 'line-through', textDecorationStyle: 'dotted', textDecorationColor: 'blue'}}>
          Dotted line-through with custom color
        </Text>
        <Text style={{textDecorationLine: 'underline line-through'}}>
          Both underline and line-through
        </Text>
      </View>
    );
  },
}, {
  title: 'Nested',
  description: 'Nested text components will inherit the styles of their ' +
    'parents (only backgroundColor is inherited from non-Text parents).  ' +
    '<Text> only supports other <Text> and raw text (strings) as children.',
  render: function() {
    return (
      <View>
        <Text>
          (Normal text,
          <Text style={{fontWeight: 'bold'}}>
            (and bold
            <Text style={{fontSize: 11, color: '#527fe4'}}>
              (and tiny inherited bold blue)
            </Text>
            )
          </Text>
          )
        </Text>
        <Text style={{opacity:0.7}}>
          (opacity
            <Text>
              (is inherited
                <Text style={{opacity:0.7}}>
                  (and accumulated
                    <Text style={{backgroundColor:'#ffaaaa'}}>
                      (and also applies to the background)
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
      </View>
    );
  },
}, {
  title: 'Text Align',
  render: function() {
    return (
      <View>
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
        <Text style={{textAlign: 'justify'}}>
          justify: this text component{"'"}s contents are laid out with "textAlign: justify"
          and as you can see all of the lines except the last one span the
          available width of the parent container.
        </Text>
      </View>
    );
  },
}, {
  title: 'Letter Spacing',
  render: function() {
    return (
      <View>
        <Text style={{letterSpacing: 0}}>
          letterSpacing = 0
        </Text>
        <Text style={{letterSpacing: 2, marginTop: 5}}>
          letterSpacing = 2
        </Text>
        <Text style={{letterSpacing: 9, marginTop: 5}}>
          letterSpacing = 9
        </Text>
        <Text style={{letterSpacing: -1, marginTop: 5}}>
          letterSpacing = -1
        </Text>
      </View>
    );
  },
}, {
  title: 'Spaces',
  render: function() {
    return (
      <Text>
        A {'generated'} {' '} {'string'} and    some &nbsp;&nbsp;&nbsp; spaces
      </Text>
    );
  },
}, {
  title: 'Line Height',
  render: function() {
    return (
      <Text>
        <Text style={{lineHeight: 35}}>
          A lot of space between the lines of this long passage that should
          wrap once.
        </Text>
      </Text>
    );
  },
}, {
  title: 'Empty Text',
  description: 'It\'s ok to have Text with zero or null children.',
  render: function() {
    return (
      <Text />
    );
  },
}, {
  title: 'Toggling Attributes',
  render: function(): React.Element<any> {
    return <AttributeToggler />;
  },
}, {
  title: 'backgroundColor attribute',
  description: 'backgroundColor is inherited from all types of views.',
  render: function() {
    return (
      <Text style={{backgroundColor: 'yellow'}}>
        Yellow container background,
        <Text style={{backgroundColor: '#ffaaaa'}}>
          {' '}red background,
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
      </Text>
    );
  },
}, {
  title: 'numberOfLines attribute',
  render: function() {
    return (
      <View>
        <Text numberOfLines={1}>
          Maximum of one line, no matter how much I write here. If I keep writing, it{"'"}ll just truncate after one line.
        </Text>
        <Text numberOfLines={2} style={{marginTop: 20}}>
          Maximum of two lines, no matter how much I write here. If I keep writing, it{"'"}ll just truncate after two lines.
        </Text>
        <Text style={{marginTop: 20}}>
          No maximum lines specified, no matter how much I write here. If I keep writing, it{"'"}ll just keep going and going.
        </Text>
      </View>
    );
  },
}, {
  title: 'Text highlighting (tap the link to see highlight)',
  render: function() {
    return (
      <View>
        <Text>Lorem ipsum dolor sit amet, <Text suppressHighlighting={false} style={{backgroundColor: 'white', textDecorationLine: 'underline', color: 'blue'}} onPress={() => null}>consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud</Text> exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.</Text>
      </View>
    );
  },
}, {
  title: 'allowFontScaling attribute',
  render: function() {
    return (
      <View>
        <Text>
          By default, text will respect Text Size accessibility setting on iOS.
          It means that all font sizes will be increased or descreased depending on the value of Text Size setting in
          {" "}<Text style={{fontWeight: 'bold'}}>Settings.app - Display & Brightness - Text Size</Text>
        </Text>
        <Text style={{marginTop: 10}}>
          You can disable scaling for your Text component by passing {"\""}allowFontScaling={"{"}false{"}\""} prop.
        </Text>
        <Text allowFontScaling={false} style={{marginTop: 20}}>
          This text will not scale.
        </Text>
      </View>
    );
  },
}, {
  title: 'Inline views',
  render: function() {
    return (
      <View>
        <Text>
          This text contains an inline blue view <View style={{width: 25, height: 25, backgroundColor: 'steelblue'}} /> and
          an inline image <Image source={require('./flux.png')} style={{width: 30, height: 11, resizeMode: 'cover'}}/>. Neat, huh?
        </Text>
      </View>
    );
  },
}, {
  title: 'Text shadow',
  render: function() {
    return (
      <View>
        <Text style={{fontSize: 20, textShadowOffset: {width: 2, height: 2}, textShadowRadius: 1, textShadowColor: '#00cccc'}}>
          Demo text shadow
        </Text>
      </View>
    );
  },
}, {
  title: 'Ellipsize mode',
  render: function() {
    return (
      <View>
        <Text numberOfLines={1}>
          This very long text should be truncated with dots in the end.
        </Text>
        <Text ellipsizeMode="middle" numberOfLines={1}>
          This very long text should be truncated with dots in the middle.
        </Text>
        <Text ellipsizeMode="head" numberOfLines={1}>
          This very long text should be truncated with dots in the beginning.
        </Text>
        <Text ellipsizeMode="clip" numberOfLines={1}>
          This very looooooooooooooooooooooooooooong text should be clipped.
        </Text>
      </View>
    );
  },
}, {
  title: 'Font variants',
  render: function() {
    return (
      <View>
        <Text style={{fontVariant: ['small-caps']}}>
          Small Caps{'\n'}
        </Text>
        <Text style={{fontFamily: (Platform.isTVOS ? 'Times' : 'Hoefler Text'), fontVariant: ['oldstyle-nums']}}>
          Old Style nums 0123456789{'\n'}
        </Text>
        <Text style={{fontFamily: (Platform.isTVOS ? 'Times' : 'Hoefler Text'), fontVariant: ['lining-nums']}}>
          Lining nums 0123456789{'\n'}
        </Text>
        <Text style={{fontVariant: ['tabular-nums']}}>
          Tabular nums{'\n'}
          1111{'\n'}
          2222{'\n'}
        </Text>
        <Text style={{fontVariant: ['proportional-nums']}}>
          Proportional nums{'\n'}
          1111{'\n'}
          2222{'\n'}
        </Text>
      </View>
    );
  },
}, {
  title: 'Dynamic Font Size Adjustment',
  render: function(): React.Element<any> {
    return <AdjustingFontSize />;
  },
}];
