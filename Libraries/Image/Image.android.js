/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Image
 * @flow
 */
'use strict';

var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var ImageResizeMode = require('ImageResizeMode');
var ImageStylePropTypes = require('ImageStylePropTypes');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var View = require('View');

var createReactNativeComponentClass = require('createReactNativeComponentClass');
var flattenStyle = require('flattenStyle');
var invariant = require('invariant');
var merge = require('merge');
var resolveAssetSource = require('resolveAssetSource');

/**
 * <Image> - A react component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.  Example usage:
 *
 *   renderImages: function() {
 *     return (
 *       <View>
 *         <Image
 *           style={styles.icon}
 *           source={require('image!myIcon')}
 *         />
 *         <Image
 *           style={styles.logo}
 *           source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
 *         />
 *       </View>
 *     );
 *   },
 *
 * More example code in ImageExample.js
 */

var ImageViewAttributes = merge(ReactNativeViewAttributes.UIView, {
  src: true,
  resizeMode: true,
});

var Image = React.createClass({
  propTypes: {
    /**
     * `uri` is a string representing the resource identifier for the image, which
     * could be an http address, a local file path, or the name of a static image
     * resource (which should be wrapped in the `require('image!name')` function).
     */
    source: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string,
      }),
      // Opaque type returned by require('./image.jpg')
      PropTypes.number,
    ]).isRequired,
    style: StyleSheetPropType(ImageStylePropTypes),
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  },

  statics: {
    resizeMode: ImageResizeMode,
  },

  mixins: [NativeMethodsMixin],

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class. Since it can render
   * as 3 different native components we need to update viewConfig accordingly
   */
  viewConfig: {
    uiViewClassName: 'RCTView',
    validAttributes: ReactNativeViewAttributes.RKView
  },

  _updateViewConfig: function(props) {
    if (props.children) {
      this.viewConfig = {
        uiViewClassName: 'RCTView',
        validAttributes: ReactNativeViewAttributes.RKView,
      };
    } else {
      this.viewConfig = {
        uiViewClassName: 'RCTImageView',
        validAttributes: ImageViewAttributes,
      };
    }
  },

  componentWillMount: function() {
    this._updateViewConfig(this.props);
  },

  componentWillReceiveProps: function(nextProps) {
    this._updateViewConfig(nextProps);
  },

  render: function() {
    var source = resolveAssetSource(this.props.source);

    // As opposed to the ios version, here it render `null`
    // when no source or source.uri... so let's not break that.

    if (source && source.uri === '') {
      console.warn('source.uri should not be an empty string');
    }

    if (source && source.uri) {
      var isNetwork = source.uri.match(/^https?:/);
      invariant(
        !(isNetwork && source.isStatic),
        'Static image URIs cannot start with "http": "' + source.uri + '"'
      );

      var {width, height} = source;
      var style = flattenStyle([{width, height}, styles.base, this.props.style]);

      var nativeProps = merge(this.props, {
        style,
        src: source.uri,
      });

      if (nativeProps.children) {
        // TODO(6033040): Consider implementing this as a separate native component
        var imageProps = merge(nativeProps, {
          style: styles.absoluteImage,
          children: undefined,
        });
        return (
          <View style={nativeProps.style}>
            <RKImage {...imageProps}/>
            {this.props.children}
          </View>
        );
      } else {
        return <RKImage {...nativeProps}/>;
      }
    }
    return null;
  }
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
  absoluteImage: {
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    position: 'absolute'
  }
});

var RKImage = createReactNativeComponentClass({
  validAttributes: ImageViewAttributes,
  uiViewClassName: 'RCTImageView',
});

module.exports = Image;
