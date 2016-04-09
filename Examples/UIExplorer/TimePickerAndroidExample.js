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
 */
'use strict';

var React = require('react');
var ReactNative = require('react-native');
var {
  TimePickerAndroid,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
} = ReactNative;

var UIExplorerBlock = require('./UIExplorerBlock');
var UIExplorerPage = require('./UIExplorerPage');

var TimePickerAndroidExample = React.createClass({

  statics: {
    title: 'TimePickerAndroid',
    description: 'Standard Android time picker dialog',
  },

  getInitialState() {
    // *Text, *Hour and *Minute are set by successCallback -- this updates the text with the time
    // picked by the user and makes it so the next time they open it the hour and minute they picked
    // before is displayed.
    return {
      isoFormatText: 'pick a time (24-hour format)',
      presetHour: 4,
      presetMinute: 4,
      presetText: 'pick a time, default: 4:04AM',
      simpleText: 'pick a time',
    };
  },

  async showPicker(stateKey, options) {
    try {
      const {action, minute, hour} = await TimePickerAndroid.open(options);
      var newState = {};
      if (action === TimePickerAndroid.timeSetAction) {
        newState[stateKey + 'Text'] = _formatTime(hour, minute);
        newState[stateKey + 'Hour'] = hour;
        newState[stateKey + 'Minute'] = minute;
      } else if (action === TimePickerAndroid.dismissedAction) {
        newState[stateKey + 'Text'] = 'dismissed';
      }
      this.setState(newState);
    } catch ({code, message}) {
      console.warn(`Error in example '${stateKey}': `, message);
    }
  },

  render() {
    return (
      <UIExplorerPage title="TimePickerAndroid">
        <UIExplorerBlock title="Simple time picker">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'simple')}>
            <Text style={styles.text}>{this.state.simpleText}</Text>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>
        <UIExplorerBlock title="Time picker with pre-set time">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'preset', {
              hour: this.state.presetHour,
              minute: this.state.presetMinute,
            })}>
            <Text style={styles.text}>{this.state.presetText}</Text>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>

        <UIExplorerBlock title="Time picker with 24-hour time format">
          <TouchableWithoutFeedback
            onPress={this.showPicker.bind(this, 'isoFormat', {
              hour: this.state.isoFormatHour,
              minute: this.state.isoFormatMinute,
              is24Hour: true,
            })}>
            <Text style={styles.text}>{this.state.isoFormatText}</Text>
          </TouchableWithoutFeedback>
        </UIExplorerBlock>
      </UIExplorerPage>
    );
  },
});

/**
 * Returns e.g. '3:05'.
 */
function _formatTime(hour, minute) {
  return hour + ':' + (minute < 10 ? '0' + minute : minute);
}

var styles = StyleSheet.create({
  text: {
    color: 'black',
  },
});

module.exports = TimePickerAndroidExample;

