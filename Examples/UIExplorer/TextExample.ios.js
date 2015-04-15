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

var React = require('react-native');
var {
  StyleSheet,
  Text,
  View,
} = React;

var Entity = React.createClass({
  render: function() {
    return (
      <Text style={styles.entity}>
        {this.props.children}
      </Text>
    );
  }
});

var AttributeToggler = React.createClass({
  getInitialState: function() {
    return {fontWeight: '500', fontSize: 15};
  },
  increaseSize: function() {
    this.setState({
      fontSize: this.state.fontSize + 1
    });
  },
  render: function() {
    var curStyle = {fontSize: this.state.fontSize};
    return (
      <Text>
        <Text style={curStyle}>
          Tap the controls below to change attributes.
        </Text>
        <Text>
          See how it will even work on{' '}
          <Text style={curStyle}>
            this nested text
          </Text>
          <Text onPress={this.increaseSize}>
            {'>> Increase Size <<'}
          </Text>
        </Text>
      </Text>
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
        <Text style={{fontFamily: 'Cochin'}}>
          Cochin
        </Text>
        <Text style={{fontFamily: 'Cochin', fontWeight: 'bold'}}>
          Cochin bold
        </Text>
        <Text style={{fontFamily: 'Helvetica'}}>
          Helvetica
        </Text>
        <Text style={{fontFamily: 'Helvetica', fontWeight: 'bold'}}>
          Helvetica bold
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
        <Text style={{textAlign: 'left'}}>
          left left left left left left left left left left left left left left left
        </Text>
        <Text style={{textAlign: 'center'}}>
          center center center center center center center center center center center
        </Text>
        <Text style={{textAlign: 'right'}}>
          right right right right right right right right right right right right right
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
  render: function(): ReactElement {
    return <AttributeToggler />;
  },
}, {
  title: 'backgroundColor attribute',
  description: 'backgroundColor is inherited from all types of views.',
  render: function() {
    return (
      <View style={{backgroundColor: 'yellow'}}>
        <Text>
          Yellow background inherited from View parent,
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
      </View>
    );
  },
}, {
  title: 'containerBackgroundColor attribute',
  render: function() {
    return (
      <View>
        <View style={{flexDirection: 'row', height: 85}}>
          <View style={{backgroundColor: '#ffaaaa', width: 150}} />
          <View style={{backgroundColor: '#aaaaff', width: 150}} />
        </View>
        <Text style={[styles.backgroundColorText, {top: -80}]}>
          Default containerBackgroundColor (inherited) + backgroundColor wash
        </Text>
        <Text style={[
          styles.backgroundColorText,
          {top: -70, containerBackgroundColor: 'transparent'}]}>
          {"containerBackgroundColor: 'transparent' + backgroundColor wash"}
        </Text>
      </View>
    );
  },
}, {
  title: 'numberOfLines attribute',
  render: function() {
    return (
      <View>
        <Text numberOfLines={1}>
          Maximum of one line no matter now much I write here. If I keep writing it{"'"}ll just truncate after one line
        </Text>
        <Text numberOfLines={2} style={{marginTop: 20}}>
          Maximum of two lines no matter now much I write here. If I keep writing it{"'"}ll just truncate after two lines
        </Text>
        <Text style={{marginTop: 20}}>
          No maximum lines specified no matter now much I write here. If I keep writing it{"'"}ll just keep going and going
        </Text>
      </View>
    );
  },
}];

var styles = StyleSheet.create({
  backgroundColorText: {
    left: 5,
    backgroundColor: 'rgba(100, 100, 100, 0.3)'
  },
  entity: {
    fontWeight: '500',
    color: '#527fe4',
  },
});
