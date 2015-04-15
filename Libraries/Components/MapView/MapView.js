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
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var View = require('View');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var deepDiffer = require('deepDiffer');
var insetsDiffer = require('insetsDiffer');
var merge = require('merge');

type Event = Object;

var MapView = React.createClass({
  mixins: [NativeMethodsMixin],

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
     * Default `value` is true.
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
       * Annotation title/subtile.
       */
      title: React.PropTypes.string,
      subtitle: React.PropTypes.string,
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

  render: function() {
    return (
      <RCTMap
        style={this.props.style}
        showsUserLocation={this.props.showsUserLocation}
        zoomEnabled={this.props.zoomEnabled}
        rotateEnabled={this.props.rotateEnabled}
        pitchEnabled={this.props.pitchEnabled}
        scrollEnabled={this.props.scrollEnabled}
        region={this.props.region}
        annotations={this.props.annotations}
        maxDelta={this.props.maxDelta}
        minDelta={this.props.minDelta}
        legalLabelInsets={this.props.legalLabelInsets}
        onChange={this._onChange}
        onTouchStart={this.props.onTouchStart}
        onTouchMove={this.props.onTouchMove}
        onTouchEnd={this.props.onTouchEnd}
        onTouchCancel={this.props.onTouchCancel}
      />
    );
  },

});

var RCTMap = createReactIOSNativeComponentClass({
  validAttributes: merge(
    ReactIOSViewAttributes.UIView, {
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

module.exports = MapView;
