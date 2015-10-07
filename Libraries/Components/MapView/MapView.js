/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule MapView
 * @flow
 */
'use strict';

var EdgeInsetsPropType = require('EdgeInsetsPropType');
var NativeMethodsMixin = require('NativeMethodsMixin');
var Platform = require('Platform');
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var View = require('View');

var createReactNativeComponentClass = require('createReactNativeComponentClass');
var deepDiffer = require('deepDiffer');
var insetsDiffer = require('insetsDiffer');
var merge = require('merge');
var requireNativeComponent = require('requireNativeComponent');

type Event = Object;
type MapRegion = {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
};

var MapView = React.createClass({
  mixins: [NativeMethodsMixin],

  checkAnnotationIds: function (annotations: Array<Object>) {

    var newAnnotations = annotations.map(function (annotation) {
      if (!annotation.id) {
        // TODO: add a base64 (or similar) encoder here
        annotation.id = encodeURIComponent(JSON.stringify(annotation));
      }

      return annotation;
    });

    this.setState({
      annotations: newAnnotations
    });
  },

  componentWillMount: function() {
    if (this.props.annotations) {
      this.checkAnnotationIds(this.props.annotations);
    }
  },

  componentWillReceiveProps: function(nextProps: Object) {
    if (nextProps.annotations) {
      this.checkAnnotationIds(nextProps.annotations);
    }
  },

  propTypes: {
    /**
     * Used to style and layout the `MapView`.  See `StyleSheet.js` and
     * `ViewStylePropTypes.js` for more info.
     */
    style: View.propTypes.style,

    /**
     * If `true` the app will ask for the user's location and focus on it.
     * Default value is `false`.
     *
     * **NOTE**: You need to add NSLocationWhenInUseUsageDescription key in
     * Info.plist to enable geolocation, otherwise it is going
     * to *fail silently*!
     */
    showsUserLocation: React.PropTypes.bool,

    /**
     * If `false` the user won't be able to pinch/zoom the map.
     * Default value is `true`.
     */
    zoomEnabled: React.PropTypes.bool,

    /**
     * When this property is set to `true` and a valid camera is associated with
     * the map, the camera’s heading angle is used to rotate the plane of the
     * map around its center point. When this property is set to `false`, the
     * camera’s heading angle is ignored and the map is always oriented so
     * that true north is situated at the top of the map view
     */
    rotateEnabled: React.PropTypes.bool,

    /**
     * When this property is set to `true` and a valid camera is associated
     * with the map, the camera’s pitch angle is used to tilt the plane
     * of the map. When this property is set to `false`, the camera’s pitch
     * angle is ignored and the map is always displayed as if the user
     * is looking straight down onto it.
     */
    pitchEnabled: React.PropTypes.bool,

    /**
     * If `false` the user won't be able to change the map region being displayed.
     * Default value is `true`.
     */
    scrollEnabled: React.PropTypes.bool,

    /**
     * The map type to be displayed.
     *
     * - standard: standard road map (default)
     * - satellite: satellite view
     * - hybrid: satellite view with roads and points of interest overlayed
     */
    mapType: React.PropTypes.oneOf([
      'standard',
      'satellite',
      'hybrid',
    ]),

    /**
     * The region to be displayed by the map.
     *
     * The region is defined by the center coordinates and the span of
     * coordinates to display.
     */
    region: React.PropTypes.shape({
      /**
       * Coordinates for the center of the map.
       */
      latitude: React.PropTypes.number.isRequired,
      longitude: React.PropTypes.number.isRequired,

      /**
       * Distance between the minimun and the maximum latitude/longitude
       * to be displayed.
       */
      latitudeDelta: React.PropTypes.number.isRequired,
      longitudeDelta: React.PropTypes.number.isRequired,
    }),

    /**
     * Map annotations with title/subtitle.
     */
    annotations: React.PropTypes.arrayOf(React.PropTypes.shape({
      /**
       * The location of the annotation.
       */
      latitude: React.PropTypes.number.isRequired,
      longitude: React.PropTypes.number.isRequired,

      /**
       * Whether the pin drop should be animated or not
       */
      animateDrop: React.PropTypes.bool,

      /**
       * Annotation title/subtile.
       */
      title: React.PropTypes.string,
      subtitle: React.PropTypes.string,

      /**
       * Whether the Annotation has callout buttons.
       */
      hasLeftCallout: React.PropTypes.bool,
      hasRightCallout: React.PropTypes.bool,

      /**
       * Event handlers for callout buttons.
       */
      onLeftCalloutPress: React.PropTypes.func,
      onRightCalloutPress: React.PropTypes.func,

      /**
       * annotation id
       */
      id: React.PropTypes.string

    })),

    /**
     * Maximum size of area that can be displayed.
     */
    maxDelta: React.PropTypes.number,

    /**
     * Minimum size of area that can be displayed.
     */
    minDelta: React.PropTypes.number,

    /**
     * Insets for the map's legal label, originally at bottom left of the map.
     * See `EdgeInsetsPropType.js` for more information.
     */
    legalLabelInsets: EdgeInsetsPropType,

    /**
     * Callback that is called continuously when the user is dragging the map.
     */
    onRegionChange: React.PropTypes.func,

    /**
     * Callback that is called once, when the user is done moving the map.
     */
    onRegionChangeComplete: React.PropTypes.func,

    /**
     * Callback that is called once, when the user taps an annotation.
     */
    onAnnotationPress: React.PropTypes.func,
  },

  _onChange: function(event: Event) {
    if (event.nativeEvent.continuous) {
      this.props.onRegionChange &&
        this.props.onRegionChange(event.nativeEvent.region);
    } else {
      this.props.onRegionChangeComplete &&
        this.props.onRegionChangeComplete(event.nativeEvent.region);
    }
  },

  _onPress: function(event: Event) {
    if (event.nativeEvent.action === 'annotation-click') {
      this.props.onAnnotationPress && this.props.onAnnotationPress(event.nativeEvent.annotation);
    }

    if (event.nativeEvent.action === 'callout-click') {
      if (!this.props.annotations) {
        return;
      }

      // Find the annotation with the id of what has been pressed
      for (var i = 0; i < this.props.annotations.length; i++) {
        var annotation = this.props.annotations[i];
        if (annotation.id === event.nativeEvent.annotationId) {
          // Pass the right function
          if (event.nativeEvent.side === 'left') {
            annotation.onLeftCalloutPress && annotation.onLeftCalloutPress(event.nativeEvent);
          } else if (event.nativeEvent.side === 'right') {
            annotation.onRightCalloutPress && annotation.onRightCalloutPress(event.nativeEvent);
          }
        }
      }

    }
  },

  render: function() {
    return <RCTMap {...this.props} onPress={this._onPress} onChange={this._onChange} />;
  },
});

if (Platform.OS === 'android') {
  var RCTMap = createReactNativeComponentClass({
    validAttributes: merge(
      ReactNativeViewAttributes.UIView, {
        active: true,
        showsUserLocation: true,
        zoomEnabled: true,
        rotateEnabled: true,
        pitchEnabled: true,
        scrollEnabled: true,
        region: {diff: deepDiffer},
        annotations: {diff: deepDiffer},
        maxDelta: true,
        minDelta: true,
        legalLabelInsets: {diff: insetsDiffer},
      }
    ),
    uiViewClassName: 'RCTMap',
  });
} else {
  var RCTMap = requireNativeComponent('RCTMap', MapView, {
    nativeOnly: {onChange: true, onPress: true}
  });
}

module.exports = MapView;
