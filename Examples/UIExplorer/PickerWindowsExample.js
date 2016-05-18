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

const React = require('react');
const ReactNative = require('react-native');
const StyleSheet = require('StyleSheet');
const UIExplorerBlock = require('UIExplorerBlock');
const UIExplorerPage = require('UIExplorerPage');

const {
  Picker,
  Text,
  TouchableWithoutFeedback,
} = ReactNative;
const Item = Picker.Item;

const PickerExample = React.createClass({

  statics: {
    title: '<Picker>',
    description: 'Provides multiple options to choose from, using a dropdown menu.',
  },

  getInitialState: function() {
    return {
      selected1: 'key1',
      selected2: 'key1',
      selected3: 'key1',
      color: 'red',
    };
  },

  render: function() {
    return (
      <UIExplorerPage title="<Picker>">
        <UIExplorerBlock title="Basic Picker">
          <Picker
            style={styles.picker}
            selectedValue={this.state.selected1}
            onValueChange={this.onValueChange.bind(this, 'selected1')}>
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
        </UIExplorerBlock>
        <UIExplorerBlock title="Disabled picker">
          <Picker style={styles.picker} enabled={false} selectedValue={this.state.selected1}>
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
        </UIExplorerBlock>
        <UIExplorerBlock title="Picker with no listener">
          <Picker style={styles.picker}>
            <Item label="hello" value="key0" />
            <Item label="world" value="key1" />
          </Picker>
          <Text>
            Cannot change the value of this picker because it doesn't update selectedValue.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Colorful pickers">
          <Picker
            style={[styles.picker, {color: 'white', backgroundColor: '#333'}]}
            selectedValue={this.state.color}
            onValueChange={this.onValueChange.bind(this, 'color')}>
            <Item label="red" color="red" value="red" />
            <Item label="green" color="green" value="green" />
            <Item label="blue" color="blue" value="blue" />
          </Picker>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },

  onValueChange: function(key: string, value: string) {
    const newState = {};
    newState[key] = value;
    this.setState(newState);
  },
});

var styles = StyleSheet.create({
  picker: {
    width: 100,
  },
});

module.exports = PickerExample;
