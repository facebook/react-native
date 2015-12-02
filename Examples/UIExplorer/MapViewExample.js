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
  MapView,
  StyleSheet,
  Text,
  TextInput,
  View,
} = React;

var regionText = {
  latitude: '0',
  longitude: '0',
  latitudeDelta: '0',
  longitudeDelta: '0',
};

type MapRegion = {
  latitude: number,
  longitude: number,
  latitudeDelta: number,
  longitudeDelta: number,
};

type MapRegionInputState = {
  region: MapRegion,
};

var MapRegionInput = React.createClass({

  propTypes: {
    region: React.PropTypes.shape({
      latitude: React.PropTypes.number.isRequired,
      longitude: React.PropTypes.number.isRequired,
      latitudeDelta: React.PropTypes.number.isRequired,
      longitudeDelta: React.PropTypes.number.isRequired,
    }),
    onChange: React.PropTypes.func.isRequired,
  },

  getInitialState(): MapRegionInputState {
    return {
      region: {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0,
        longitudeDelta: 0,
      }
    };
  },

  componentWillReceiveProps: function(nextProps) {
    this.setState({
      region: nextProps.region || this.getInitialState().region
    });
  },

  render: function() {
    var region = this.state.region || this.getInitialState().region;
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
            selectTextOnFocus={true}
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
            selectTextOnFocus={true}
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
            selectTextOnFocus={true}
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
            selectTextOnFocus={true}
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
    regionText.latitude = e.nativeEvent.text;
  },

  _onChangeLongitude: function(e) {
    regionText.longitude = e.nativeEvent.text;
  },

  _onChangeLatitudeDelta: function(e) {
    regionText.latitudeDelta = e.nativeEvent.text;
  },

  _onChangeLongitudeDelta: function(e) {
    regionText.longitudeDelta = e.nativeEvent.text;
  },

  _change: function() {
    this.setState({
      region: {
        latitude: parseFloat(regionText.latitude),
        longitude: parseFloat(regionText.longitude),
        latitudeDelta: parseFloat(regionText.latitudeDelta),
        longitudeDelta: parseFloat(regionText.longitudeDelta),
      },
    });
    this.props.onChange(this.state.region);
  },

});

type Annotations = Array<{
  animateDrop?: boolean,
  latitude: number,
  longitude: number,
  title?: string,
  subtitle?: string,
  hasLeftCallout?: boolean,
  hasRightCallout?: boolean,
  onLeftCalloutPress?: Function,
  onRightCalloutPress?: Function,
  tintColor?: string,
  image?: any,
  id?: string,
}>;
type MapViewExampleState = {
  isFirstLoad: boolean,
  mapRegion?: MapRegion,
  mapRegionInput?: MapRegion,
  annotations?: Annotations,
};

var MapViewExample = React.createClass({

  getInitialState(): MapViewExampleState {
    return {
      isFirstLoad: true,
    };
  },

  render() {
    return (
      <View>
        <MapView
          style={styles.map}
          onRegionChange={this._onRegionChange}
          onRegionChangeComplete={this._onRegionChangeComplete}
          region={this.state.mapRegion}
          annotations={this.state.annotations}
        />
        <MapRegionInput
          onChange={this._onRegionInputChanged}
          region={this.state.mapRegionInput}
        />
      </View>
    );
  },

  _getAnnotations(region): Annotations {
    return [{
      longitude: region.longitude,
      latitude: region.latitude,
      title: 'You Are Here',
    }];
  },

  _onRegionChange(region) {
    this.setState({
      mapRegionInput: region,
    });
  },

  _onRegionChangeComplete(region) {
    if (this.state.isFirstLoad) {
      this.setState({
        mapRegionInput: region,
        annotations: this._getAnnotations(region),
        isFirstLoad: false,
      });
    }
  },

  _onRegionInputChanged(region) {
    this.setState({
      mapRegion: region,
      mapRegionInput: region,
      annotations: this._getAnnotations(region),
    });
  },

});

type CalloutMapViewExampleState = {
  isFirstLoad: boolean,
  annotations?: Annotations,
  mapRegion?: MapRegion,
};
var CalloutMapViewExample = React.createClass({

  getInitialState(): CalloutMapViewExampleState {
    return {
      isFirstLoad: true,
    };
  },

  render() {
    if (this.state.isFirstLoad) {
      var onRegionChangeComplete = (region) => {
        this.setState({
          isFirstLoad: false,
          annotations: [{
            longitude: region.longitude,
            latitude: region.latitude,
            title: 'More Info...',
            hasRightCallout: true,
            onRightCalloutPress: () => {
              alert('You Are Here');
            },
          }],
        });
      };
    }

    return (
      <MapView
        style={styles.map}
        onRegionChangeComplete={onRegionChangeComplete}
        region={this.state.mapRegion}
        annotations={this.state.annotations}
      />
    );
  },

});

type CustomPinColorMapViewExampleState = {
  isFirstLoad: boolean,
  annotations?: Annotations,
  mapRegion?: MapRegion,
};
var CustomPinColorMapViewExample = React.createClass({

  getInitialState(): CustomPinColorMapViewExampleState {
    return {
      isFirstLoad: true,
    };
  },

  render() {
    if (this.state.isFirstLoad) {
      var onRegionChangeComplete = (region) => {
        this.setState({
          isFirstLoad: false,
          annotations: [{
            longitude: region.longitude,
            latitude: region.latitude,
            title: 'You Are Purple',
            tintColor: MapView.PinColors.PURPLE,
          }],
        });
      };
    }

    return (
      <MapView
        style={styles.map}
        onRegionChangeComplete={onRegionChangeComplete}
        region={this.state.mapRegion}
        annotations={this.state.annotations}
      />
    );
  },

});

type CustomPinImageMapViewExampleState = {
  isFirstLoad: boolean,
  annotations?: Annotations,
  mapRegion?: MapRegion,
};
var CustomPinImageMapViewExample = React.createClass({

  getInitialState(): CustomPinImageMapViewExampleState {
    return {
      isFirstLoad: true,
    };
  },

  render() {
    if (this.state.isFirstLoad) {
      var onRegionChangeComplete = (region) => {
        this.setState({
          isFirstLoad: false,
          annotations: [{
            longitude: region.longitude,
            latitude: region.latitude,
            title: 'Thumbs Up!',
            image: require('image!uie_thumb_big'),
          }],
        });
      };
    }

    return (
      <MapView
        style={styles.map}
        onRegionChangeComplete={onRegionChangeComplete}
        region={this.state.mapRegion}
        annotations={this.state.annotations}
      />
    );
  },

});

type Overlays = Array<{
  coordinates?: Array<{
    latitude: number,
    longitude: number,
  }>,
  lineWidth?: number,
  strokeColor?: string,
  fillColor?: string,
  id?: string,
}>;
type CustomOverlayMapViewExampleState = {
  isFirstLoad: boolean,
  overlays?: Overlays,
  annotations?: Annotations,
  mapRegion?: MapRegion,
};
var CustomOverlayMapViewExample = React.createClass({

  getInitialState(): CustomOverlayMapViewExampleState {
    return {
      isFirstLoad: true,
    };
  },

  render() {
    if (this.state.isFirstLoad) {
      var onRegionChangeComplete = (region) => {
        this.setState({
          isFirstLoad: false,
          overlays: [{
            coordinates:[
              {latitude: 32.47, longitude: -107.85},
              {latitude: 45.13, longitude: -94.48},
              {latitude: 39.27, longitude: -83.25},
              {latitude: 32.47, longitude: -107.85},
            ],
            strokeColor: '#f007',
            lineWidth: 3,
          }],
        });
      };
    }

    return (
      <MapView
        style={styles.map}
        onRegionChangeComplete={onRegionChangeComplete}
        region={this.state.mapRegion}
        overlays={this.state.overlays}
      />
    );
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

exports.displayName = (undefined: ?string);
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
  },
  {
    title: 'Callout example',
    render() {
      return  <CalloutMapViewExample style={styles.map} />;
    }
  },
  {
    title: 'Custom pin color',
    render() {
      return  <CustomPinColorMapViewExample style={styles.map} />;
    }
  },
  {
    title: 'Custom pin image',
    render() {
      return  <CustomPinImageMapViewExample style={styles.map} />;
    }
  },
  {
    title: 'Custom overlay',
    render() {
      return  <CustomOverlayMapViewExample style={styles.map} />;
    }
  },
];
