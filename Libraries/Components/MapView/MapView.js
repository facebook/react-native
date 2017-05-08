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

const ColorPropType = require('ColorPropType');
const EdgeInsetsPropType = require('EdgeInsetsPropType');
const Image = require('Image');
const NativeMethodsMixin = require('NativeMethodsMixin');
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const deprecatedPropType = require('deprecatedPropType');
const processColor = require('processColor');
const resolveAssetSource = require('resolveAssetSource');
const requireNativeComponent = require('requireNativeComponent');

type Event = Object;

/**
 * State of an annotation on the map.
 */
export type AnnotationDragState = $Enum<{
  /**
   * Annotation is not being touched.
   */
  idle: string,
  /**
   * Annotation dragging has began.
   */
  starting: string,
  /**
   * Annotation is being dragged.
   */
  dragging: string,
  /**
   * Annotation dragging is being canceled.
   */
  canceling: string,
  /**
   * Annotation dragging has ended.
   */
  ending: string,
}>;

/**
 * **IMPORTANT: This component is now DEPRECATED and will be removed
 * in January 2017 (React Native version 0.42). This component only supports
 * iOS.**
 *
 * **Please use
 * [react-native-maps](https://github.com/airbnb/react-native-maps) by Airbnb
 * instead of this component.** Our friends at Airbnb have done an amazing job
 * building a cross-platform `MapView` component that is more feature
 * complete. It is used extensively (over 9k installs / month).
 *
 * `MapView` is used to display embeddable maps and annotations using
 * `MKMapView`.
 *
 * ```
 * import React, { Component } from 'react';
 * import { MapView } from 'react-native';
 *
 * class MapMyRide extends Component {
 *   render() {
 *     return (
 *       <MapView
 *         style={{height: 200, margin: 40}}
 *         showsUserLocation={true}
 *       />
 *     );
 *   }
 * }
 * ```
 *
 */

const MapView = React.createClass({

  componentWillMount: function() {
    console.warn(
      'MapView is now deprecated and will be removed from React Native in version 0.42. ' +
      'Please use the react-native-maps module which is more feature complete ' +
      'and works on Android too: https://github.com/airbnb/react-native-maps\n' +
      'It is actively maintained and widely used.\n\n' +
      'Once MapView is removed from React Native in v0.42, we will release the ' +
      'code as deprecated-react-native-ios-mapview. You will be able to ' +
      'continue using that and migrate to react-native-maps your own pace later.\n\n' +
      'For more info, check out https://github.com/facebook/react-native/pull/10500'
    );
  },

  mixins: [NativeMethodsMixin],

  propTypes: {
    ...View.propTypes,
    /**
     * Used to style and layout the `MapView`.
     */
    style: View.propTypes.style,

    /**
     * If `true` the app will ask for the user's location and display it on
     * the map. Default value is `false`.
     *
     * **NOTE**: You'll need to add the `NSLocationWhenInUseUsageDescription`
     * key in Info.plist to enable geolocation, otherwise it will fail silently.
     */
    showsUserLocation: React.PropTypes.bool,

    /**
     * If `true` the map will follow the user's location whenever it changes.
     * Note that this has no effect unless `showsUserLocation` is enabled.
     * Default value is `true`.
     */
    followUserLocation: React.PropTypes.bool,

    /**
     * If `false` points of interest won't be displayed on the map.
     * Default value is `true`.
     */
    showsPointsOfInterest: React.PropTypes.bool,

    /**
     * If `false`, compass won't be displayed on the map.
     * Default value is `true`.
     */
    showsCompass: React.PropTypes.bool,

    /**
     * If `false` the user won't be able to pinch/zoom the map.
     * Default value is `true`.
     */
    zoomEnabled: React.PropTypes.bool,

    /**
     * When this property is set to `true` and a valid camera is associated with
     * the map, the camera's heading angle is used to rotate the plane of the
     * map around its center point.
     *
     * When this property is set to `false`, the
     * camera's heading angle is ignored and the map is always oriented so
     * that true north is situated at the top of the map view
     */
    rotateEnabled: React.PropTypes.bool,

    /**
     * When this property is set to `true` and a valid camera is associated
     * with the map, the camera's pitch angle is used to tilt the plane
     * of the map.
     *
     * When this property is set to `false`, the camera's pitch
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
     * - `standard`: Standard road map (default).
     * - `satellite`: Satellite view.
     * - `hybrid`: Satellite view with roads and points of interest overlaid.
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
       * Distance between the minimum and the maximum latitude/longitude
       * to be displayed.
       */
      latitudeDelta: React.PropTypes.number,
      longitudeDelta: React.PropTypes.number,
    }),

    /**
     * Map annotations with title and subtitle.
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
       * Whether the pin should be draggable or not
       */
      draggable: React.PropTypes.bool,

      /**
       * Event that fires when the annotation drag state changes.
       */
      onDragStateChange: React.PropTypes.func,

      /**
       * Event that fires when the annotation gets was tapped by the user
       * and the callout view was displayed.
       */
      onFocus: React.PropTypes.func,

      /**
       * Event that fires when another annotation or the mapview itself
       * was tapped and a previously shown annotation will be closed.
       */
      onBlur: React.PropTypes.func,

      /**
       * Annotation title and subtile.
       */
      title: React.PropTypes.string,
      subtitle: React.PropTypes.string,

      /**
       * Callout views.
       */
      leftCalloutView: React.PropTypes.element,
      rightCalloutView: React.PropTypes.element,
      detailCalloutView: React.PropTypes.element,

      /**
       * The pin color. This can be any valid color string, or you can use one
       * of the predefined PinColors constants. Applies to both standard pins
       * and custom pin images.
       *
       * Note that on iOS 8 and earlier, only the standard PinColor constants
       * are supported for regular pins. For custom pin images, any tintColor
       * value is supported on all iOS versions.
       */
      tintColor: ColorPropType,

      /**
       * Custom pin image. This must be a static image resource inside the app.
       */
      image: Image.propTypes.source,

      /**
       * Custom pin view. If set, this replaces the pin or custom pin image.
       */
      view: React.PropTypes.element,

      /**
       * annotation id
       */
      id: React.PropTypes.string,

      /**
       * Deprecated. Use the left/right/detailsCalloutView props instead.
       */
      hasLeftCallout: deprecatedPropType(
        React.PropTypes.bool,
        'Use `leftCalloutView` instead.'
      ),
      hasRightCallout: deprecatedPropType(
        React.PropTypes.bool,
        'Use `rightCalloutView` instead.'
      ),
      onLeftCalloutPress: deprecatedPropType(
        React.PropTypes.func,
        'Use `leftCalloutView` instead.'
      ),
      onRightCalloutPress: deprecatedPropType(
        React.PropTypes.func,
        'Use `rightCalloutView` instead.'
      ),
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
      strokeColor: ColorPropType,
      fillColor: ColorPropType,

      /**
       * Overlay id
       */
      id: React.PropTypes.string
    })),

    /**
     * Maximum size of the area that can be displayed.
     */
    maxDelta: React.PropTypes.number,

    /**
     * Minimum size of the area that can be displayed.
     */
    minDelta: React.PropTypes.number,

    /**
     * Insets for the map's legal label, originally at bottom left of the map.
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
     * Deprecated. Use annotation `onFocus` and `onBlur` instead.
     */
    onAnnotationPress: React.PropTypes.func,

    /**
     * @platform android
     */
    active: React.PropTypes.bool,
  },

  statics: {
    /**
     * Standard iOS MapView pin color constants, to be used with the
     * `annotation.tintColor` property. On iOS 8 and earlier these are the
     * only supported values when using regular pins. On iOS 9 and later
     * you are not obliged to use these, but they are useful for matching
     * the standard iOS look and feel.
     */
    PinColors: {
      RED: '#ff3b30',
      GREEN: '#4cd964',
      PURPLE: '#c969e0',
    },
  },

  render: function() {
    let children = [], {annotations, overlays, followUserLocation} = this.props;
    annotations = annotations && annotations.map((annotation: Object) => {
      let {
        id,
        image,
        tintColor,
        view,
        leftCalloutView,
        rightCalloutView,
        detailCalloutView,
      } = annotation;

      if (!view && image && tintColor) {
        view = <Image
          style={{
            tintColor: processColor(tintColor),
          }}
          source={image}
        />;
        image = undefined;
      }
      if (view) {
        if (image) {
          console.warn('`image` and `view` both set on annotation. Image will be ignored.');
        }
        var viewIndex = children.length;
        children.push(React.cloneElement(view, {
          // $FlowFixMe - An array of styles should be fine
          style: [styles.annotationView, view.props.style || {}]
        }));
      }
      if (leftCalloutView) {
        var leftCalloutViewIndex = children.length;
        children.push(React.cloneElement(leftCalloutView, {
          style: [styles.calloutView, leftCalloutView.props.style || {}]
        }));
      }
      if (rightCalloutView) {
        var rightCalloutViewIndex = children.length;
        children.push(React.cloneElement(rightCalloutView, {
          style: [styles.calloutView, rightCalloutView.props.style || {}]
        }));
      }
      if (detailCalloutView) {
        var detailCalloutViewIndex = children.length;
        children.push(React.cloneElement(detailCalloutView, {
          style: [styles.calloutView, detailCalloutView.props.style || {}]
        }));
      }

      const result = {
        ...annotation,
        tintColor: tintColor && processColor(tintColor),
        image,
        viewIndex,
        leftCalloutViewIndex,
        rightCalloutViewIndex,
        detailCalloutViewIndex,
        view: undefined,
        leftCalloutView: undefined,
        rightCalloutView: undefined,
        detailCalloutView: undefined,
      };
      result.id = id || encodeURIComponent(JSON.stringify(result));
      result.image = image && resolveAssetSource(image);
      return result;
    });
    overlays = overlays && overlays.map((overlay: Object) => {
      const {id, fillColor, strokeColor} = overlay;
      const result = {
        ...overlay,
        strokeColor: strokeColor && processColor(strokeColor),
        fillColor: fillColor && processColor(fillColor),
      };
      result.id = id || encodeURIComponent(JSON.stringify(result));
      return result;
    });

    const findByAnnotationId = (annotationId: string) => {
      if (!annotations) {
        return null;
      }
      for (let i = 0, l = annotations.length; i < l; i++) {
        if (annotations[i].id === annotationId) {
          return annotations[i];
        }
      }
      return null;
    };

    // TODO: these should be separate events, to reduce bridge traffic
    let onPress, onAnnotationDragStateChange, onAnnotationFocus, onAnnotationBlur;
    if (annotations) {
      onPress = (event: Event) => {
        if (event.nativeEvent.action === 'annotation-click') {
          // TODO: Remove deprecated onAnnotationPress API call later.
          this.props.onAnnotationPress &&
            this.props.onAnnotationPress(event.nativeEvent.annotation);
        } else if (event.nativeEvent.action === 'callout-click') {
          const annotation = findByAnnotationId(event.nativeEvent.annotationId);
          if (annotation) {
            // Pass the right function
            if (event.nativeEvent.side === 'left' && annotation.onLeftCalloutPress) {
              annotation.onLeftCalloutPress(event.nativeEvent);
            } else if (event.nativeEvent.side === 'right' && annotation.onRightCalloutPress) {
              annotation.onRightCalloutPress(event.nativeEvent);
            }
          }
        }
      };
      onAnnotationDragStateChange = (event: Event) => {
        const annotation = findByAnnotationId(event.nativeEvent.annotationId);
        if (annotation) {
          // Call callback
          annotation.onDragStateChange &&
            annotation.onDragStateChange(event.nativeEvent);
        }
      };
      onAnnotationFocus = (event: Event) => {
        const annotation = findByAnnotationId(event.nativeEvent.annotationId);
        if (annotation && annotation.onFocus) {
          annotation.onFocus(event.nativeEvent);
        }
      };
      onAnnotationBlur = (event: Event) => {
        const annotation = findByAnnotationId(event.nativeEvent.annotationId);
        if (annotation && annotation.onBlur) {
          annotation.onBlur(event.nativeEvent);
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

    // followUserLocation defaults to true if showUserLocation is set
    if (followUserLocation === undefined) {
      followUserLocation = this.props.showUserLocation;
    }

    return (
      <RCTMap
        {...this.props}
        annotations={annotations}
        children={children}
        followUserLocation={followUserLocation}
        overlays={overlays}
        onPress={onPress}
        onChange={onChange}
        onAnnotationDragStateChange={onAnnotationDragStateChange}
        onAnnotationFocus={onAnnotationFocus}
        onAnnotationBlur={onAnnotationBlur}
      />
    );
  },
});

const styles = StyleSheet.create({
  annotationView: {
    position: 'absolute',
    backgroundColor: 'transparent',
  },
  calloutView: {
    position: 'absolute',
    backgroundColor: 'white',
  },
});

const RCTMap = requireNativeComponent('RCTMap', MapView, {
  nativeOnly: {
    onAnnotationDragStateChange: true,
    onAnnotationFocus: true,
    onAnnotationBlur: true,
    onChange: true,
    onPress: true
  }
});

module.exports = MapView;
