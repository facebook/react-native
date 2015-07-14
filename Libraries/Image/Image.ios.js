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

var EdgeInsetsPropType = require('EdgeInsetsPropType');
var ImageResizeMode = require('ImageResizeMode');
var ImageStylePropTypes = require('ImageStylePropTypes');
var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');

var flattenStyle = require('flattenStyle');
var invariant = require('invariant');
var merge = require('merge');
var requireNativeComponent = require('requireNativeComponent');
var resolveAssetSource = require('resolveAssetSource');
var verifyPropTypes = require('verifyPropTypes');
var warning = require('warning');

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * Example usage:
 *
 * ```
 * renderImages: function() {
 *   return (
 *     <View>
 *       <Image
 *         style={styles.icon}
 *         source={require('image!myIcon')}
 *       />
 *       <Image
 *         style={styles.logo}
 *         source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
 *       />
 *       <Image
 *         style={styles.logo}
 *         source={{  uri: 'assets-library://...',
 *                    options: { assetUseMaximumSize: true } 
 *                 }}
 *       />
 *     </View>
 *   );
 * },
 * ```
 */

var Image = React.createClass({
  propTypes: {
    /**
     * `uri` is a string representing the resource identifier for the image, which
     * could be an http address, a local file path, or the name of a static image
     * resource (which should be wrapped in the `require('image!name')` function).
     *
     * `options` supports the following optional properties:
     *
     *   Photos Framework and Asset Library:
     *   -----------------------------------
     *    assetUseMaximumSize (boolean): Boolean value indicating whether to use the full 
     *                                   resolution asset. Defaults to false.
     *
     *          If false, the image will be automatically sized based
     *          on the target dimensions specified in the style property of the
     *          <Image... /> tag (width, height).
     *    
     *          If true, the full resolution asset will be used.
     *          This can result in substantial memory usage and potential crashes, 
     *          especially when rendering many images in sequence. Consider that
     *          an 8MP photo taken with an iPhone6 will require 32MB of memory to
     *          display in full resolution (3264x2448).
     *
     *
     *   Photos Framework only (assets with uri matching ph://...):
     *   ----------------------------------------------------------
     *    contentMode (string): Content mode used when requesting images using the Photos Framework.
     *                  `fit`  (PHImageContentModeAspectFit)   default
     *                  `fill` (PHImageContentModeAspectFill)
     *
     *    renderMode (string): Render mode used when reqeusting images using the Photos Framework.
     *                  `fast`   (PHImageRequestOptionsResizeModeFast)   default
     *                  `exact`  (PHImageRequestOptionsResizeModeFast)
     *                  `none`   (PHImageRequestOptionsResizeModeNone)
     *
     *
     */
    source: PropTypes.shape({
      uri: PropTypes.string,
      assetOptions: PropTypes.object,
    }),
    /**
     * A static image to display while downloading the final image off the
     * network.
     */
    defaultSource: PropTypes.shape({
      uri: PropTypes.string,
    }),
    /**
     * Whether this element should be revealed as an accessible element.
     */
    accessible: PropTypes.bool,
    /**
     * Custom string to display for accessibility.
     */
    accessibilityLabel: PropTypes.string,
    /**
     * When the image is resized, the corners of the size specified
     * by capInsets will stay a fixed size, but the center content and borders
     * of the image will be stretched.  This is useful for creating resizable
     * rounded buttons, shadows, and other resizable assets.  More info on
     * [Apple documentation](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/index.html#//apple_ref/occ/instm/UIImage/resizableImageWithCapInsets)
     */
    capInsets: EdgeInsetsPropType,
    /**
     * Determines how to resize the image when the frame doesn't match the raw
     * image dimensions.
     */
    resizeMode: PropTypes.oneOf(['cover', 'contain', 'stretch']),
    style: StyleSheetPropType(ImageStylePropTypes),
    /**
     * A unique identifier for this element to be used in UI Automation
     * testing scripts.
     */
    testID: PropTypes.string,
    /**
     * Invoked on mount and layout changes with
     *
     *   {nativeEvent: { layout: {x, y, width, height}}}.
     */
    onLayout: PropTypes.func,
    /**
     * Invoked on load start
     */
    onLoadStart: PropTypes.func,
    /**
     * Invoked on download progress with
     *
     *   {nativeEvent: { written, total}}.
     */
    onLoadProgress: PropTypes.func,
    /**
     * Invoked on load abort
     */
    onLoadAbort: PropTypes.func,
    /**
     * Invoked on load error
     *
     *   {nativeEvent: { error}}.
     */
    onLoadError: PropTypes.func,
    /**
     * Invoked on load end
     *
     */
    onLoaded: PropTypes.func

  },

  statics: {
    resizeMode: ImageResizeMode,
  },

  mixins: [NativeMethodsMixin],

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  viewConfig: {
    uiViewClassName: 'UIView',
    validAttributes: ReactNativeViewAttributes.UIView
  },

  render: function() {
    for (var prop in nativeOnlyProps) {
      if (this.props[prop] !== undefined) {
        console.warn('Prop `' + prop + ' = ' + this.props[prop] + '` should ' +
          'not be set directly on Image.');
      }
    }
    var source = resolveAssetSource(this.props.source) || {};

    var {width, height} = source;
    var style = flattenStyle([{width, height}, styles.base, this.props.style]);
    invariant(style, 'style must be initialized');

    var isNetwork = source.uri && source.uri.match(/^https?:/);
    invariant(
      !(isNetwork && source.isStatic),
      'static image uris cannot start with "http": "' + source.uri + '"'
    );
    var isStored = !source.isStatic && !isNetwork;
    var RawImage = isNetwork ? RCTNetworkImage : RCTStaticImage;

    if (this.props.style && this.props.style.tintColor) {
      warning(RawImage === RCTStaticImage, 'tintColor style only supported on static images.');
    }
    var resizeMode = this.props.resizeMode || style.resizeMode || 'cover';

    var nativeProps = merge(this.props, {
      style,
      resizeMode,
      tintColor: style.tintColor,
    });
    if (isStored) {
      var options = {
        // iOS specific asset options
        assetResizeMode: 'fast',
        assetContentMode: 'fill',
        assetTargetSize: { width: style.width, height: style.height },
        assetUseMaximumSize: false
      };
      
      Object.assign( options, this.props.source.options );
      
      nativeProps.imageTag = { uri: source.uri,
                               options: options };
                               
    } else {
      nativeProps.src = source.uri;
    }
    if (this.props.defaultSource) {
      nativeProps.defaultImageSrc = this.props.defaultSource.uri;
    }
    nativeProps.progressHandlerRegistered = isNetwork && this.props.onLoadProgress;
    return <RawImage {...nativeProps} />;
  }
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

var RCTNetworkImage = requireNativeComponent('RCTNetworkImageView', null);
var RCTStaticImage = requireNativeComponent('RCTStaticImage', null);

var nativeOnlyProps = {
  src: true,
  defaultImageSrc: true,
  imageTag: true,
  progressHandlerRegistered: true
};
if (__DEV__) {
  verifyPropTypes(Image, RCTStaticImage.viewConfig, nativeOnlyProps);
  verifyPropTypes(Image, RCTNetworkImage.viewConfig, nativeOnlyProps);
}

module.exports = Image;
