/**
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

var Entity = React.createClass({
  render: function() {
    return (
      <Text style={{fontWeight: '500', color: '#527fe4'}}>
        {this.props.children}
      </Text>
    );
  }
});

var AttributeToggler = React.createClass({
  getInitialState: function() {
    return {fontWeight: 'bold', fontSize: 15};
  },
  toggleWeight: function() {
    this.setState({
      fontWeight: this.state.fontWeight === 'bold' ? 'normal' : 'bold'
    });
  },
  increaseSize: function() {
    this.setState({
      fontSize: this.state.fontSize + 1
    });
  },
  render: function() {
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
        <Text style={{fontFamily: 'Arial'}}>
          Arial
        </Text>
        <Text style={{fontFamily: 'Arial', fontWeight: 'bold'}}>
          Arial bold
        </Text>
        <Text style={{fontFamily: 'Calibri'}}>
          Calibri
        </Text>
        <Text style={{fontFamily: 'Calibri', fontWeight: 'bold'}}>
          Calibri bold
        </Text>
        <Text style={{fontFamily: 'Segoe UI'}}>
          Segoe UI
        </Text>
        <Text style={{fontFamily: 'Segoe UI', fontWeight: 'bold'}}>
          Segoe UI bold
        </Text>
        <Text style={{fontFamily: 'Times New Roman'}}>
          Times New Roman
        </Text>
        <Text style={{fontFamily: 'Times New Roman', fontWeight: 'bold'}}>
          Times New Roman bold
        </Text>
        <Text style={{fontFamily: 'Verdana'}}>
          Verdana
        </Text>
        <Text style={{fontFamily: 'Verdana', fontWeight: 'bold'}}>
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
        <Text style={{fontWeight: '100'}}>
          Move fast and be ultralight
        </Text>
        <Text style={{fontWeight: '200'}}>
          Move fast and be light
        </Text>
        <Text style={{fontWeight: 'normal'}}>
          Move fast and be normal
        </Text>
        <Text style={{fontWeight: 'bold'}}>
          Move fast and be bold
        </Text>
        <Text style={{fontWeight: '900'}}>
          Move fast and be ultrabold
        </Text>
      </View>
    );
  },
}, {
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
  title: 'Unicode',
  render: function() {
    return (
      <View style={{flex: 1}}>
        <View style={{flexDirection: 'row'}}>
          <Text>
            星际争霸是世界上最好的游戏。
          </Text>
        </View>
        <View style={{flex: 1}}>
          <Text>
            星际争霸是世界上最好的游戏。
          </Text>
        </View>
        <View style={{flex: 1, alignItems: 'center'}}>
          <Text>
            星际争霸是世界上最好的游戏。
          </Text>
        </View>
        <View style={{flex: 1}}>
          <Text>
            星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。星际争霸是世界上最好的游戏。
          </Text>
        </View>
      </View>
    )
  }
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
  title: 'Empty Text',
  description: 'It\'s ok to have Text with zero or null children.',
  render: function() {
    return (
      <Text />
    );
  },
}, {
  title: 'Toggling Attributes',
  render: function(): ReactElement {
    return <AttributeToggler />;
  },
}];

var styles = StyleSheet.create({
  backgroundColorText: {
    margin: 5,
    marginBottom: 0,
    backgroundColor: 'rgba(100, 100, 100, 0.3)'
  },
});
