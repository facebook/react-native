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
  AsyncStorage,
  PickerIOS,
  Text,
  View
} = ReactNative;
var PickerItemIOS = PickerIOS.Item;

var STORAGE_KEY = '@AsyncStorageExample:key';
var COLORS = ['red', 'orange', 'yellow', 'green', 'blue'];

var BasicStorageExample = React.createClass({
  componentDidMount() {
    this._loadInitialState().done();
  },

  async _loadInitialState() {
    try {
      var value = await AsyncStorage.getItem(STORAGE_KEY);
      if (value !== null){
        this.setState({selectedValue: value});
        this._appendMessage('Recovered selection from disk: ' + value);
      } else {
        this._appendMessage('Initialized with no selection on disk.');
      }
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  },

  getInitialState() {
    return {
      selectedValue: COLORS[0],
      messages: [],
    };
  },

  render() {
    var color = this.state.selectedValue;
    return (
      <View>
        <PickerIOS
          selectedValue={color}
          onValueChange={this._onValueChange}>
          {COLORS.map((value) => (
            <PickerItemIOS
              key={value}
              value={value}
              label={value}
            />
          ))}
        </PickerIOS>
        <Text>
          {'Selected: '}
          <Text style={{color}}>
            {this.state.selectedValue}
          </Text>
        </Text>
        <Text>{' '}</Text>
        <Text onPress={this._removeStorage}>
          Press here to remove from storage.
        </Text>
        <Text>{' '}</Text>
        <Text>Messages:</Text>
        {this.state.messages.map((m) => <Text key={m}>{m}</Text>)}
      </View>
    );
  },

  async _onValueChange(selectedValue) {
    this.setState({selectedValue});
    try {
      await AsyncStorage.setItem(STORAGE_KEY, selectedValue);
      this._appendMessage('Saved selection to disk: ' + selectedValue);
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  },

  async _removeStorage() {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      this._appendMessage('Selection removed from disk.');
    } catch (error) {
      this._appendMessage('AsyncStorage error: ' + error.message);
    }
  },

  _appendMessage(message) {
    this.setState({messages: this.state.messages.concat(message)});
  },
});

exports.title = 'AsyncStorage';
exports.description = 'Asynchronous local disk storage.';
exports.examples = [
  {
    title: 'Basics - getItem, setItem, removeItem',
    render(): ReactElement<any> { return <BasicStorageExample />; }
  },
];
