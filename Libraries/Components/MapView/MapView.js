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
var Image = require('Image');
var NativeMethodsMixin = require('NativeMethodsMixin');
var Platform = require('Platform');
var RCTMapConstants = require('NativeModules').UIManager.RCTMap.Constants;
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var View = require('View');

var deepDiffer = require('deepDiffer');
var insetsDiffer = require('insetsDiffer');
var merge = require('merge');
var processColor = require('processColor');
var resolveAssetSource = require('resolveAssetSource');
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

  checkOverlayIds: function (overlays: Array<Object>) {

    var newOverlays = overlays.map(function (overlay) {
      if (!overlay.id) {
        // TODO: add a base64 (or similar) encoder here
        overlay.id = encodeURIComponent(JSON.stringify(overlay));
      }
      return overlay;
    });

    this.setState({
      overlays: newOverlays
    });
  },

  componentWillMount: function() {
    if (this.props.annotations) {
      this.checkAnnotationIds(this.props.annotations);
    }
    if (this.props.overlays) {
      this.checkOverlayIds(this.props.overlays);
    }
  },

  componentWillReceiveProps: function(nextProps: Object) {
    if (nextProps.annotations) {
      this.checkAnnotationIds(nextProps.annotations);
    }
    if (nextProps.overlays) {
      this.checkOverlayIds(nextProps.overlays);
    }
  },

  propTypes: {
    ...View.propTypes,
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
     * If `false` points of interest won't be displayed on the map.
     * Default value is `true`.
     * @platform ios
     */
    showsPointsOfInterest: React.PropTypes.bool,

    /**
     * If `false` compass won't be displayed on the map.
     * Default value is `true`.
     * @platform ios
     */
    showsCompass: React.PropTypes.bool,

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
       * The pin color. This can be any valid color string, or you can use one
       * of the predefined PinColors constants. Applies to both standard pins
       * and custom pin images.
       * @platform ios
       */
      tintColor: React.PropTypes.string,

      /**
       * Custom pin image. This must be a static image resource inside the app.
       * @platform ios
       */
      image: Image.propTypes.source,
      
      /**
       * annotation id
       */
      id: React.PropTypes.string,
    })),

    /**
     * Map overlays
     */
    overlays: React.PropTypes.arrayOf(React.PropTypes.shape({
      /**
       * Polyline coordinates
       */
      coordinates: React.PropTypes.arrayOf(React.PropTypes.shape({
        latitude: React.PropTypes.number.isRequired,
        longitude: React.PropTypes.number.isRequired
      })),

      /**
       * Line attributes
       */
      lineWidth: React.PropTypes.number,
      strokeColor: React.PropTypes.string,
      fillColor: React.PropTypes.string,

      /**
       * Overlay id
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

    /**
     * @platform android
     */
    active: React.PropTypes.bool,
  },

  render: function() {

    let {annotations, overlays} = this.props;
    annotations = annotations && annotations.map((annotation: Object) => {
      let {tintColor, image} = annotation;
      return {
        ...annotation,
        tintColor: tintColor && processColor(tintColor),
        image: image && resolveAssetSource(image),
      };
    });
    overlays = overlays && overlays.map((overlay: Object) => {
      let {strokeColor, fillColor} = overlay;
      return {
        ...overlay,
        strokeColor: strokeColor && processColor(strokeColor),
        fillColor: fillColor && processColor(fillColor),
      };
    });

    // TODO: these should be separate events, to reduce bridge traffic
    if (annotations) {
      var onPress = (event: Event) => {
        if (!annotations) {
          return;
        }
        if (event.nativeEvent.action === 'annotation-click') {
          this.props.onAnnotationPress &&
            this.props.onAnnotationPress(event.nativeEvent.annotation);
        } else if (event.nativeEvent.action === 'callout-click') {
          // Find the annotation with the id that was pressed
          for (let i = 0, l = annotations.length; i < l; i++) {
            let annotation = annotations[i];
            if (annotation.id === event.nativeEvent.annotationId) {
              // Pass the right function
              if (event.nativeEvent.side === 'left') {
                annotation.onLeftCalloutPress &&
                  annotation.onLeftCalloutPress(event.nativeEvent);
              } else if (event.nativeEvent.side === 'right') {
                annotation.onRightCalloutPress &&
                  annotation.onRightCalloutPress(event.nativeEvent);
              }
              break;
            }
          }
        }
      };
    }

    // TODO: these should be separate events, to reduce bridge traffic
    if (this.props.onRegionChange || this.props.onRegionChangeComplete) {
      var onChange = (event: Event) => {
        if (event.nativeEvent.continuous) {
          this.props.onRegionChange &&
            this.props.onRegionChange(event.nativeEvent.region);
        } else {
          this.props.onRegionChangeComplete &&
            this.props.onRegionChangeComplete(event.nativeEvent.region);
        }
      };
    }

    return (
      <RCTMap
        {...this.props}
        annotations={annotations}
        overlays={overlays}
        onPress={onPress}
        onChange={onChange}
      />
    );
  },
});

/**
 * Standard iOS MapView pin color constants, to be used with the
 * `annotation.tintColor` property. You are not obliged to use these,
 * but they are useful for matching the standard iOS look and feel.
 */
let PinColors = RCTMapConstants && RCTMapConstants.PinColors;
MapView.PinColors = PinColors && {
  RED: PinColors.RED,
  GREEN: PinColors.GREEN,
  PURPLE: PinColors.PURPLE,
};

var RCTMap = requireNativeComponent('RCTMap', MapView, {
  nativeOnly: {onChange: true, onPress: true}
});

module.exports = MapView;
