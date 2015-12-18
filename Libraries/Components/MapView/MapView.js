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

const EdgeInsetsPropType = require('EdgeInsetsPropType');
const Image = require('Image');
const NativeMethodsMixin = require('NativeMethodsMixin');
const Platform = require('Platform');
const RCTMapConfig = require('UIManager').RCTMap;
const RCTMapConstants = RCTMapConfig && RCTMapConfig.Constants;
const React = require('React');
const StyleSheet = require('StyleSheet');
const View = require('View');

const processColor = require('processColor');
const resolveAssetSource = require('resolveAssetSource');
const requireNativeComponent = require('requireNativeComponent');

type Event = Object;

const MapView = React.createClass({
  mixins: [NativeMethodsMixin],

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
     * - hybrid: satellite view with roads and points of interest overlaid
     *
     * @platform ios
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
     * Map annotations with title/subtitle.
     * @platform ios
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
      tintColor: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
      ]),

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
      hasLeftCallout: React.PropTypes.bool,
      hasRightCallout: React.PropTypes.bool,
      onLeftCalloutPress: React.PropTypes.func,
      onRightCalloutPress: React.PropTypes.func,

    })),

    /**
     * Map overlays
     * @platform ios
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
      strokeColor: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
      ]),
      fillColor: React.PropTypes.oneOfType([
        React.PropTypes.string,
        React.PropTypes.number
      ]),

      /**
       * Overlay id
       */
      id: React.PropTypes.string
    })),

    /**
     * Maximum size of area that can be displayed.
     * @platform ios
     */
    maxDelta: React.PropTypes.number,

    /**
     * Minimum size of area that can be displayed.
     * @platform ios
     */
    minDelta: React.PropTypes.number,

    /**
     * Insets for the map's legal label, originally at bottom left of the map.
     * See `EdgeInsetsPropType.js` for more information.
     * @platform ios
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
    let children = [], {annotations, overlays} = this.props;
    annotations = annotations && annotations.map((annotation: Object, index: number) => {
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
      if (__DEV__) {
        ['hasLeftCallout', 'onLeftCalloutPress'].forEach(key => {
          if (annotation[key]) {
            console.warn('`' + key + '` is deprecated. Use leftCalloutView instead.');
          }
        });
        ['hasRightCallout', 'onRightCalloutPress'].forEach(key => {
          if (annotation[key]) {
            console.warn('`' + key + '` is deprecated. Use rightCalloutView instead.');
          }
        });
      }
      return {
        ...annotation,
        tintColor: tintColor && processColor(tintColor),
        image: image && resolveAssetSource(image),
        viewIndex,
        leftCalloutViewIndex,
        rightCalloutViewIndex,
        detailCalloutViewIndex,
        view: undefined,
        leftCalloutView: undefined,
        rightCalloutView: undefined,
        detailCalloutView: undefined,
        id: id || String(index),
      };
    });
    overlays = overlays && overlays.map((overlay: Object, index: number) => {
      let {id, fillColor, strokeColor} = overlay;
      return {
        ...overlay,
        strokeColor: strokeColor && processColor(strokeColor),
        fillColor: fillColor && processColor(fillColor),
        id: id || String(index),
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
        children={children}
        overlays={overlays}
        onPress={onPress}
        onChange={onChange}
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

/**
 * Standard iOS MapView pin color constants, to be used with the
 * `annotation.tintColor` property. On iOS 8 and earlier these are the
 * only supported values when using regular pins. On iOS 9 and later
 * you are not obliged to use these, but they are useful for matching
 * the standard iOS look and feel.
 */
const PinColors = RCTMapConstants && RCTMapConstants.PinColors;
MapView.PinColors = PinColors && {
  RED: PinColors.RED,
  GREEN: PinColors.GREEN,
  PURPLE: PinColors.PURPLE,
};

const RCTMap = requireNativeComponent('RCTMap', MapView, {
  nativeOnly: {onChange: true, onPress: true}
});

module.exports = MapView;
