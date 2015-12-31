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
  Image,
  MapView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
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
  latitudeDelta?: number,
  longitudeDelta?: number,
};

type MapRegionInputState = {
  region: MapRegion,
};

var MapRegionInput = React.createClass({

  propTypes: {
    region: React.PropTypes.shape({
      latitude: React.PropTypes.number.isRequired,
      longitude: React.PropTypes.number.isRequired,
      latitudeDelta: React.PropTypes.number,
      longitudeDelta: React.PropTypes.number,
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
            value={
              region.latitudeDelta == null ? '' : String(region.latitudeDelta)
            }
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
            value={
              region.longitudeDelta == null ? '' : String(region.longitudeDelta)
            }
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
  tintColor?: number | string,
  image?: any,
  id?: string,
  view?: ReactElement,
  leftCalloutView?: ReactElement,
  rightCalloutView?: ReactElement,
  detailCalloutView?: ReactElement,
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

type AnnotationExampleState = {
  isFirstLoad: boolean,
  annotations?: Annotations,
  mapRegion?: MapRegion,
};
var AnnotationExample = React.createClass({

  getInitialState(): AnnotationExampleState {
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
            ...this.props.annotation,
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
    render() {
      return <MapViewExample />;
    }
  },
  {
    title: 'Map shows user location',
    render() {
      return <MapView style={styles.map} showsUserLocation={true} />;
    }
  },
  {
    title: 'Callout example',
    render() {
      return <AnnotationExample style={styles.map} annotation={{
        title: 'More Info...',
        rightCalloutView: (
          <TouchableOpacity
            onPress={() => {
              alert('You Are Here');
            }}>
            <Image
              style={{width:30, height:30}}
              source={require('image!uie_thumb_selected')}
            />
          </TouchableOpacity>
        ),
      }}/>;
    }
  },
  {
    title: 'Custom pin color',
    render() {
      return <AnnotationExample style={styles.map} annotation={{
        title: 'You Are Purple',
        tintColor: MapView.PinColors.PURPLE,
      }}/>;
    }
  },
  {
    title: 'Custom pin image',
    render() {
      return <AnnotationExample style={styles.map} annotation={{
        title: 'Thumbs Up!',
        image: require('image!uie_thumb_big'),
      }}/>;
    }
  },
  {
    title: 'Custom pin view',
    render() {
      return <AnnotationExample style={styles.map} annotation={{
        title: 'Thumbs Up!',
        view: <View style={{
          alignItems: 'center',
        }}>
          <Text style={{fontWeight: 'bold', color: '#f007'}}>
            Thumbs Up!
          </Text>
          <Image
            style={{width: 90, height: 65, resizeMode: 'cover'}}
            source={require('image!uie_thumb_big')}
          />
        </View>,
      }}/>;
    }
  },
  {
    title: 'Custom overlay',
    render() {
      return <MapView
        style={styles.map}
        region={{
          latitude: 39.06,
          longitude: -95.22,
        }}
        overlays={[{
          coordinates:[
            {latitude: 32.47, longitude: -107.85},
            {latitude: 45.13, longitude: -94.48},
            {latitude: 39.27, longitude: -83.25},
            {latitude: 32.47, longitude: -107.85},
          ],
          strokeColor: '#f007',
          lineWidth: 3,
        }]}
      />;
    }
  },
];
