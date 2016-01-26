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

const React = require('react-native');
const UIExplorerBlock = require('UIExplorerBlock');
const UIExplorerPage = require('UIExplorerPage');

const {
  PickerAndroid,
  Text,
  TouchableWithoutFeedback,
} = React;
const Item = PickerAndroid.Item;

const PickerAndroidExample = React.createClass({

  statics: {
    title: '<PickerAndroid>',
    description: 'Provides multiple options to choose from, using either a dropdown menu or a dialog.',
  },

  getInitialState: function() {
    return {
      selected1: 'key1',
      selected2: 'key1',
      selected3: 'key1',
      selected4: 'key1',
      color: 'red',
      mode: PickerAndroid.MODE_DIALOG,
    };
  },

  displayName: 'Android Picker',

  render: function() {
    return (
      <UIExplorerPage title="<PickerAndroid>">
        <UIExplorerBlock title="Basic Picker">
          <PickerAndroid
            style={{width: 100, height: 56}}
            onSelect={this.onSelect.bind(this, 'selected1')}>
            <Item text="hello" value="key0" selected={this.state.selected1 === 'key0'} />
            <Item text="world" value="key1" selected={this.state.selected1 === 'key1'} />
          </PickerAndroid>
        </UIExplorerBlock>
        <UIExplorerBlock title="Disabled picker">
          <PickerAndroid style={{width: 100, height: 56}} enabled={false}>
            <Item text="hello" value="key0" selected={this.state.selected1 === 'key0'} />
            <Item text="world" value="key1" selected={this.state.selected1 === 'key1'} />
          </PickerAndroid>
        </UIExplorerBlock>
        <UIExplorerBlock title="Dropdown Picker">
          <PickerAndroid
            style={{width: 100, height: 56}}
            onSelect={this.onSelect.bind(this, 'selected2')}
            mode="dropdown">
            <Item text="hello" value="key0" selected={this.state.selected2 === 'key0'} />
            <Item text="world" value="key1" selected={this.state.selected2 === 'key1'} />
          </PickerAndroid>
        </UIExplorerBlock>
        <UIExplorerBlock title="Alternating Picker">
          <PickerAndroid
            style={{width: 100, height: 56}}
            onSelect={this.onSelect.bind(this, 'selected3')}
            mode={this.state.mode}>
            <Item text="hello" value="key0" selected={this.state.selected3 === 'key0'} />
            <Item text="world" value="key1" selected={this.state.selected3 === 'key1'} />
          </PickerAndroid>
          <TouchableWithoutFeedback onPress={this.changeMode}>
            <Text>Tap here to switch between dialog/dropdown.</Text>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>
        <UIExplorerBlock title="Picker with prompt message">
          <PickerAndroid
            style={{width: 100, height: 56}}
            onSelect={this.onSelect.bind(this, 'selected4')}
            prompt="Pick one, just one">
            <Item text="hello" value="key0" selected={this.state.selected4 === 'key0'} />
            <Item text="world" value="key1" selected={this.state.selected4 === 'key1'} />
          </PickerAndroid>
        </UIExplorerBlock>
        <UIExplorerBlock title="Picker with no listener">
          <PickerAndroid style={{width: 100, height: 56}}>
            <Item text="hello" value="key0" />
            <Item text="world" value="key1" />
          </PickerAndroid>
          <Text>
            You can not change the value of this picker because it doesn't set a selected prop on
            its items.
          </Text>
        </UIExplorerBlock>
        <UIExplorerBlock title="Colorful pickers">
          <PickerAndroid style={{width: 100, height: 56, color: 'black'}}
            onSelect={this.onSelect.bind(this, 'color')}
            mode="dropdown">
            <Item text="red" color="red" value="red" selected={this.state.color === 'red'}/>
            <Item text="green" color="green" value="green" selected={this.state.color === 'green'}/>
            <Item text="blue" color="blue" value="blue" selected={this.state.color === 'blue'}/>
          </PickerAndroid>
          <PickerAndroid style={{width: 100, height: 56}}
            onSelect={this.onSelect.bind(this, 'color')}
            mode="dialog">
            <Item text="red" color="red" value="red" selected={this.state.color === 'red'}/>
            <Item text="green" color="green" value="green" selected={this.state.color === 'green'}/>
            <Item text="blue" color="blue" value="blue" selected={this.state.color === 'blue'} />
          </PickerAndroid>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },

  changeMode: function() {
    const newMode = this.state.mode === PickerAndroid.MODE_DIALOG
        ? PickerAndroid.MODE_DROPDOWN
        : PickerAndroid.MODE_DIALOG;
    this.setState({mode: newMode});
  },

  onSelect: function(key: string, value: string) {
    const newState = {};
    newState[key] = value;
    this.setState(newState);
  },
});

module.exports = PickerAndroidExample;
