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
var ImageSourcePropType = require('ImageSourcePropType');
var ImageStylePropTypes = require('ImageStylePropTypes');
var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var PropTypes = require('ReactPropTypes');
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');

var flattenStyle = require('flattenStyle');
var requireNativeComponent = require('requireNativeComponent');
var resolveAssetSource = require('resolveAssetSource');

var {
  ImageLoader,
  ImageViewManager,
  NetworkImageViewManager,
} = NativeModules;

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
 *         source={require('./myIcon.png')}
 *       />
 *       <Image
 *         style={styles.logo}
 *         source={{uri: 'http://facebook.github.io/react/img/logo_og.png'}}
 *       />
 *     </View>
 *   );
 * },
 * ```
 */
var Image = React.createClass({
  propTypes: {
    style: StyleSheetPropType(ImageStylePropTypes),
    /**
     * The image source (either a remote URL or a local file resource).
     */
    source: ImageSourcePropType,
    /**
     * A static image to display while loading the image source.
     * @platform ios
     */
    defaultSource: PropTypes.oneOfType([
      PropTypes.shape({
        /**
         * `uri` is a string representing the resource identifier for the image, which
         * should be either a local file path or the name of a static image resource
         * (which should be wrapped in the `require('./path/to/image.png')` function).
         */
        uri: PropTypes.string,
        /**
         * `width` and `height` can be specified if known at build time, in which case
         * these will be used to set the default `<Image/>` component dimensions.
         */
        width: PropTypes.number,
        height: PropTypes.number,
        /**
         * `scale` is used to indicate the scale factor of the image. Defaults to 1.0 if
         * unspecified, meaning that one image pixel equates to one display point / DIP.
         */
        scale: PropTypes.number,
      }),
      // Opaque type returned by require('./image.jpg')
      PropTypes.number,
    ]),
    /**
     * When true, indicates the image is an accessibility element.
     * @platform ios
     */
    accessible: PropTypes.bool,
    /**
     * The text that's read by the screen reader when the user interacts with
     * the image.
     * @platform ios
     */
    accessibilityLabel: PropTypes.string,
    /**
    * blurRadius: the blur radius of the blur filter added to the image
    * @platform ios
    */
    blurRadius: PropTypes.number,
    /**
     * When the image is resized, the corners of the size specified
     * by capInsets will stay a fixed size, but the center content and borders
     * of the image will be stretched.  This is useful for creating resizable
     * rounded buttons, shadows, and other resizable assets.  More info on
     * [Apple documentation](https://developer.apple.com/library/ios/documentation/UIKit/Reference/UIImage_Class/index.html#//apple_ref/occ/instm/UIImage/resizableImageWithCapInsets)
     * @platform ios
     */
    capInsets: EdgeInsetsPropType,
    /**
     * Determines how to resize the image when the frame doesn't match the raw
     * image dimensions.
     *
     * 'cover': Scale the image uniformly (maintain the image's aspect ratio)
     * so that both dimensions (width and height) of the image will be equal
     * to or larger than the corresponding dimension of the view (minus padding).
     *
     * 'contain': Scale the image uniformly (maintain the image's aspect ratio)
     * so that both dimensions (width and height) of the image will be equal to
     * or less than the corresponding dimension of the view (minus padding).
     *
     * 'stretch': Scale width and height independently, This may change the
     * aspect ratio of the src.
     */
    resizeMode: PropTypes.oneOf(['cover', 'contain', 'stretch']),
    /**
     * A unique identifier for this element to be used in UI Automation
     * testing scripts.
     */
    testID: PropTypes.string,
    /**
     * Invoked on mount and layout changes with
     * `{nativeEvent: {layout: {x, y, width, height}}}`.
     */
    onLayout: PropTypes.func,
    /**
     * Invoked on load start
     */
    onLoadStart: PropTypes.func,
    /**
     * Invoked on download progress with `{nativeEvent: {loaded, total}}`
     * @platform ios
     */
    onProgress: PropTypes.func,
    /**
     * Invoked on load error with `{nativeEvent: {error}}`
     * @platform ios
     */
    onError: PropTypes.func,
    /**
     * Invoked when load completes successfully
     */
    onLoad: PropTypes.func,
    /**
     * Invoked when load either succeeds or fails
     */
    onLoadEnd: PropTypes.func,
  },

  statics: {
    resizeMode: ImageResizeMode,
    /**
     * Retrieve the width and height (in pixels) of an image prior to displaying it.
     * This method can fail if the image cannot be found, or fails to download.
     *
     * In order to retrieve the image dimensions, the image may first need to be
     * loaded or downloaded, after which it will be cached. This means that in
     * principle you could use this method to preload images, however it is not
     * optimized for that purpose, and may in future be implemented in a way that
     * does not fully load/download the image data. A proper, supported way to
     * preload images will be provided as a separate API.
     *
     * @platform ios
     */
    getSize: function(
      uri: string,
      success: (width: number, height: number) => void,
      failure: (error: any) => void,
    ) {
      ImageViewManager.getSize(uri, success, failure || function() {
        console.warn('Failed to get size for image: ' + uri);
      });
    },
    /**
     * Prefetches a remote image for later use by downloading it to the disk
     * cache
     */
    prefetch(url: string) {
      return ImageLoader.prefetchImage(url);
    },
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
    var source = resolveAssetSource(this.props.source) || { uri: null, width: undefined, height: undefined };
    var {width, height, uri} = source;
    var style = flattenStyle([{width, height}, styles.base, this.props.style]) || {};

    var isNetwork = uri && uri.match(/^https?:/);
    var RawImage = isNetwork ? RCTNetworkImageView : RCTImageView;
    var resizeMode = this.props.resizeMode || (style || {}).resizeMode || 'cover'; // Workaround for flow bug t7737108
    var tintColor = (style || {}).tintColor; // Workaround for flow bug t7737108

    // This is a workaround for #8243665. RCTNetworkImageView does not support tintColor
    // TODO: Remove this hack once we have one image implementation #8389274
    if (isNetwork && (tintColor || this.props.blurRadius)) {
      RawImage = RCTImageView;
    }
    
    if (uri === '') {
      console.warn('source.uri should not be an empty string');
    }
    
    if (this.props.src) {
      console.warn('The <Image> component requires a `source` property rather than `src`.');
    }

    return (
      <RawImage
        {...this.props}
        style={style}
        resizeMode={resizeMode}
        tintColor={tintColor}
        source={source}
      />
    );
  },
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

var RCTImageView = requireNativeComponent('RCTImageView', Image);
var RCTNetworkImageView = NetworkImageViewManager ? requireNativeComponent('RCTNetworkImageView', Image) : RCTImageView;


module.exports = Image;
