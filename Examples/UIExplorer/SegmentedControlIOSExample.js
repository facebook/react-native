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
  SegmentedControlIOS,
  Text,
  View,
  StyleSheet
} = ReactNative;

var BasicSegmentedControlExample = React.createClass({
  render() {
    return (
      <View>
        <View style={{marginBottom: 10}}>
          <SegmentedControlIOS values={['One', 'Two']} />
        </View>
        <View>
          <SegmentedControlIOS values={['One', 'Two', 'Three', 'Four', 'Five']} />
        </View>
      </View>
    );
  }
});

var PreSelectedSegmentedControlExample = React.createClass({
  render() {
    return (
      <View>
        <View>
          <SegmentedControlIOS values={['One', 'Two']} selectedIndex={0} />
        </View>
      </View>
    );
  }
});

var MomentarySegmentedControlExample = React.createClass({
  render() {
    return (
      <View>
        <View>
          <SegmentedControlIOS values={['One', 'Two']} momentary={true} />
        </View>
      </View>
    );
  }
});

var DisabledSegmentedControlExample = React.createClass({
  render() {
    return (
      <View>
        <View>
          <SegmentedControlIOS enabled={false} values={['One', 'Two']} selectedIndex={1} />
        </View>
      </View>
    );
  },
});

var ColorSegmentedControlExample = React.createClass({
  render() {
    return (
      <View>
        <View style={{marginBottom: 10}}>
          <SegmentedControlIOS tintColor="#ff0000" values={['One', 'Two', 'Three', 'Four']} selectedIndex={0} />
        </View>
        <View>
          <SegmentedControlIOS tintColor="#00ff00" values={['One', 'Two', 'Three']} selectedIndex={1} />
        </View>
      </View>
    );
  },
});

var EventSegmentedControlExample = React.createClass({
  getInitialState() {
    return {
      values: ['One', 'Two', 'Three'],
      value: 'Not selected',
      selectedIndex: undefined
    };
  },

  render() {
    return (
      <View>
        <Text style={styles.text} >
          Value: {this.state.value}
        </Text>
        <Text style={styles.text} >
          Index: {this.state.selectedIndex}
        </Text>
        <SegmentedControlIOS
          values={this.state.values}
          selectedIndex={this.state.selectedIndex}
          onChange={this._onChange}
          onValueChange={this._onValueChange} />
      </View>
    );
  },

  _onChange(event) {
    this.setState({
      selectedIndex: event.nativeEvent.selectedSegmentIndex,
    });
  },

  _onValueChange(value) {
    this.setState({
      value: value,
    });
  }
});

var styles = StyleSheet.create({
  text: {
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '500',
    margin: 10,
  },
});

exports.title = '<SegmentedControlIOS>';
exports.displayName = 'SegmentedControlExample';
exports.description = 'Native segmented control';
exports.examples = [
  {
    title: 'Segmented controls can have values',
    render(): ReactElement { return <BasicSegmentedControlExample />; }
  },
  {
    title: 'Segmented controls can have a pre-selected value',
    render(): ReactElement { return <PreSelectedSegmentedControlExample />; }
  },
  {
    title: 'Segmented controls can be momentary',
    render(): ReactElement { return <MomentarySegmentedControlExample />; }
  },
  {
    title: 'Segmented controls can be disabled',
    render(): ReactElement { return <DisabledSegmentedControlExample />; }
  },
  {
    title: 'Custom colors can be provided',
    render(): ReactElement { return <ColorSegmentedControlExample />; }
  },
  {
    title: 'Change events can be detected',
    render(): ReactElement { return <EventSegmentedControlExample />; }
  }
];
