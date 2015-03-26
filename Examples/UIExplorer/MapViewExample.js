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
var StyleSheet = require('StyleSheet');
var {
  MapView,
  Text,
  TextInput,
  View,
} = React;

var MapRegionInput = React.createClass({

  propTypes: {
    region: React.PropTypes.shape({
      latitude: React.PropTypes.number,
      longitude: React.PropTypes.number,
      latitudeDelta: React.PropTypes.number,
      longitudeDelta: React.PropTypes.number,
    }),
    onChange: React.PropTypes.func.isRequired,
  },

  getInitialState: function() {
    return {
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    };
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState(nextProps.region);
  },

  render: function() {
    var region = this.state;
    return (
      <View>
        <View style={styles.row}>
          <Text>
            {'Latitude'}
          </Text>
          <TextInput
            value={'' + region.latitude}
            style={styles.textInput}
            onChange={this._onChangeLatitude}
          />
        </View>
        <View style={styles.row}>
          <Text>
            {'Longitude'}
          </Text>
          <TextInput
            value={'' + region.longitude}
            style={styles.textInput}
            onChange={this._onChangeLongitude}
          />
        </View>
        <View style={styles.row}>
          <Text>
            {'Latitude delta'}
          </Text>
          <TextInput
            value={'' + region.latitudeDelta}
            style={styles.textInput}
            onChange={this._onChangeLatitudeDelta}
          />
        </View>
        <View style={styles.row}>
          <Text>
            {'Longitude delta'}
          </Text>
          <TextInput
            value={'' + region.longitudeDelta}
            style={styles.textInput}
            onChange={this._onChangeLongitudeDelta}
          />
        </View>
        <View style={styles.changeButton}>
          <Text onPress={this._change}>
            {'Change'}
          </Text>
        </View>
      </View>
    );
  },

  _onChangeLatitude: function(e) {
    this.setState({latitude: parseFloat(e.nativeEvent.text)});
  },

  _onChangeLongitude: function(e) {
    this.setState({longitude: parseFloat(e.nativeEvent.text)});
  },

  _onChangeLatitudeDelta: function(e) {
    this.setState({latitudeDelta: parseFloat(e.nativeEvent.text)});
  },

  _onChangeLongitudeDelta: function(e) {
    this.setState({longitudeDelta: parseFloat(e.nativeEvent.text)});
  },

  _change: function() {
    this.props.onChange(this.state);
  },

});

var MapViewExample = React.createClass({

  getInitialState() {
    return {
      mapRegion: null,
      mapRegionInput: null,
    };
  },

  render() {
    return (
      <View>
        <MapView
          style={styles.map}
          onRegionChange={this._onRegionChanged}
          region={this.state.mapRegion}
        />
        <MapRegionInput
          onChange={this._onRegionInputChanged}
          region={this.state.mapRegionInput}
        />
      </View>
    );
  },

  _onRegionChanged(region) {
    this.setState({mapRegionInput: region});
  },

  _onRegionInputChanged(region) {
    this.setState({
      mapRegion: region,
      mapRegionInput: region,
    });
  },

});

var styles = StyleSheet.create({
  map: {
    height: 150,
    margin: 10,
    borderWidth: 1,
    borderColor: '#000000',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  textInput: {
    width: 150,
    height: 20,
    borderWidth: 0.5,
    borderColor: '#aaaaaa',
    fontSize: 13,
    padding: 4,
  },
  changeButton: {
    alignSelf: 'center',
    marginTop: 5,
    padding: 3,
    borderWidth: 0.5,
    borderColor: '#777777',
  },
});

exports.title = '<MapView>';
exports.description = 'Base component to display maps';
exports.examples = [
  {
    title: 'Map',
    render(): ReactElement { return <MapViewExample />; }
  },
  {
    title: 'Map shows user location',
    render() {
      return  <MapView style={styles.map} showsUserLocation={true} />;
    }
  }
];
