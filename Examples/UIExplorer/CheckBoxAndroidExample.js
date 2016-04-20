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
  CheckBoxAndroid,
  Text,
  View
} = ReactNative;

var BasicCheckBoxExample = React.createClass({
  getInitialState() {
   return {
     firstCheckboxChecked: true,
     secondCheckboxChecked: false
   };
  },
  render() {
    return (
      <View>
        <CheckBoxAndroid
          onValueChange={(value) => this.setState({firstCheckboxChecked: value})}
          text="First Checkbox"
          style={{marginBottom: 10}}
          value={this.state.firstCheckboxChecked} />
        <CheckBoxAndroid
          onValueChange={(value) => this.setState({secondCheckboxChecked: value})}
          text="Second Checkbox"
          value={this.state.secondCheckboxChecked}/>
      </View>
    );
  }
});

var DisabledCheckBoxExample = React.createClass({
  render() {
    return (
      <View>
        <CheckBoxAndroid
          enabled={false}
          text="First Checkbox"
          style={{marginBottom: 10}}
          value={true} />
        <CheckBoxAndroid
          enabled={false}
          text="Second Checkbox"
          value={false}/>
      </View>
    );
  }
});

var EventCheckBoxExample = React.createClass({
  getInitialState() {
    return {
      eventCheckBoxIsOn: false,
      eventCheckBoxRegressionIsOn: true,
    };
  },
  render() {
    return (
      <View style={{flexDirection: 'row', justifyContent: 'space-around'}}>
        <View>
        <CheckBoxAndroid
           onValueChange={(value) => this.setState({eventCheckBoxIsOn: value})}
           style={{marginBottom: 10}}
           value={this.state.eventCheckBoxIsOn} />
         <CheckBoxAndroid
           onValueChange={(value) => this.setState({eventCheckBoxIsOn: value})}
           style={{marginBottom: 10}}
           value={this.state.eventCheckBoxIsOn} />
         <Text>{this.state.eventCheckBoxIsOn ? 'On' : 'Off'}</Text>
        </View>
        <View>
        <CheckBoxAndroid
          onValueChange={(value) => this.setState({eventCheckBoxRegressionIsOn: value})}
          style={{marginBottom: 10}}
          value={this.state.eventCheckBoxRegressionIsOn} />
        <CheckBoxAndroid
          onValueChange={(value) => this.setState({eventCheckBoxRegressionIsOn: value})}
          style={{marginBottom: 10}}
          value={this.state.eventCheckBoxRegressionIsOn} />
        <Text>{this.state.eventCheckBoxRegressionIsOn ? 'On' : 'Off'}</Text>
        </View>
      </View>
    );
  }
});

var LayoutCheckBoxExample = React.createClass({
  render() {
    return (
      <View>
        <CheckBoxAndroid
          enabled={false}
          text="First Checkbox"
          style={{alignSelf: 'stretch'}}
          value={true} />
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          <CheckBoxAndroid
            enabled={false}
            text="Second Checkbox"
            value={true} />
          <CheckBoxAndroid
            enabled={false}
            text="Third Checkbox"
            value={false}/>
          <CheckBoxAndroid
            enabled={false}
            text="Fourth Checkbox"
            value={false}/>
          </View>
          <View style={{flexDirection: 'row'}}>
          <CheckBoxAndroid
            style={{flex: 1}}
            enabled={false}
            text="Sixth Checkbox"
            value={true} />
          <CheckBoxAndroid
            style={{flex: 1}}
            enabled={false}
            text="Seventh Checkbox"
            value={false}/>
        </View>
      </View>
    );
  }
});

var examples = [
  {
   title: 'CheckBoxes can be checked and unchecked',
   render(): ReactElement { return <BasicCheckBoxExample />; }
  },
  {
   title: 'CheckBoxes can be disabled',
   render(): ReactElement { return <DisabledCheckBoxExample />; }
  },
  {
   title: 'Change events can be detected',
   render(): ReactElement { return <EventCheckBoxExample />; }
  },
  {
   title: 'CheckBoxes are controlled components',
   render(): ReactElement { return <CheckBoxAndroid />; }
  },
  {
   title: 'Layout Test',
   render(): ReactElement { return <LayoutCheckBoxExample />; }
  },
];

exports.title = '<CheckBoxAndroid>';
exports.displayName = 'CheckBoxAndroidExample';
exports.description = 'Native Android checkbox';
exports.examples = examples;
