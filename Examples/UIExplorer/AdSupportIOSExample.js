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
  AdSupportIOS,
  StyleSheet,
  Text,
  View,
} = ReactNative;

exports.framework = 'React';
exports.title = 'Advertising ID';
exports.description = 'Example of using the ad support API.';

exports.examples = [
  {
    title: 'Ad Support IOS',
    render: function(): ReactElement {
      return <AdSupportIOSExample />;
    },
  }
];

var AdSupportIOSExample = React.createClass({
  getInitialState: function() {
    return {
      deviceID: 'No IDFA yet',
      hasAdvertiserTracking: 'unset',
    };
  },

  componentDidMount: function() {
    AdSupportIOS.getAdvertisingId(
      this._onDeviceIDSuccess,
      this._onDeviceIDFailure
    );

    AdSupportIOS.getAdvertisingTrackingEnabled(
      this._onHasTrackingSuccess,
      this._onHasTrackingFailure
    );
  },

  _onHasTrackingSuccess: function(hasTracking) {
    this.setState({
      'hasAdvertiserTracking': hasTracking,
    });
  },

  _onHasTrackingFailure: function(e) {
    this.setState({
      'hasAdvertiserTracking': 'Error!',
    });
  },

  _onDeviceIDSuccess: function(deviceID) {
    this.setState({
      'deviceID': deviceID,
    });
  },

  _onDeviceIDFailure: function(e) {
    this.setState({
      'deviceID': 'Error!',
    });
  },

  render: function() {
    return (
      <View>
        <Text>
          <Text style={styles.title}>Advertising ID: </Text>
          {JSON.stringify(this.state.deviceID)}
        </Text>
        <Text>
          <Text style={styles.title}>Has Advertiser Tracking: </Text>
          {JSON.stringify(this.state.hasAdvertiserTracking)}
        </Text>
      </View>
    );
  }
});

var styles = StyleSheet.create({
  title: {
    fontWeight: '500',
  },
});
