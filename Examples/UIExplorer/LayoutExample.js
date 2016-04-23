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
  StyleSheet,
  Text,
  View,
} = ReactNative;

var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var Circle = React.createClass({
  render: function() {
    var size = this.props.size || 20;
    return (
      <View
        style={{
          borderRadius: size / 2,
          backgroundColor: '#527fe4',
          width: size,
          height: size,
          margin: 1,
        }}
      />
    );
  }
});

var CircleBlock = React.createClass({
  render: function() {
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
});

var LayoutExample = React.createClass({
  statics: {
    title: 'Layout - Flexbox',
    description: 'Examples of using the flexbox API to layout views.',
  },

  displayName: 'LayoutExample',

  render: function() {
    return (
      <UIExplorerPage title={this.props.navigator ? null : 'Layout'}>
        <UIExplorerBlock title="Flex Direction">
          <Text>row</Text>
          <CircleBlock style={{flexDirection: 'row'}}>
            <Circle /><Circle /><Circle /><Circle /><Circle />
          </CircleBlock>
          <Text>column</Text>
          <CircleBlock style={{flexDirection: 'column'}}>
            <Circle /><Circle /><Circle /><Circle /><Circle />
          </CircleBlock>
          <View style={[styles.overlay, {position: 'absolute', top: 15, left: 160}]}>
            <Text>{'top: 15, left: 160'}</Text>
          </View>
        </UIExplorerBlock>

        <UIExplorerBlock title="Justify Content - Main Direction">
          <Text>flex-start</Text>
          <CircleBlock style={{justifyContent: 'flex-start'}}>
            <Circle /><Circle /><Circle /><Circle /><Circle />
          </CircleBlock>
          <Text>center</Text>
          <CircleBlock style={{justifyContent: 'center'}}>
            <Circle /><Circle /><Circle /><Circle /><Circle />
          </CircleBlock>
          <Text>flex-end</Text>
          <CircleBlock style={{justifyContent: 'flex-end'}}>
            <Circle /><Circle /><Circle /><Circle /><Circle />
          </CircleBlock>
          <Text>space-between</Text>
          <CircleBlock style={{justifyContent: 'space-between'}}>
            <Circle /><Circle /><Circle /><Circle /><Circle />
          </CircleBlock>
          <Text>space-around</Text>
          <CircleBlock style={{justifyContent: 'space-around'}}>
            <Circle /><Circle /><Circle /><Circle /><Circle />
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
});

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
