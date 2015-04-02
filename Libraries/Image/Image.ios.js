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
var NativeMethodsMixin = require('NativeMethodsMixin');
var NativeModules = require('NativeModules');
var PropTypes = require('ReactPropTypes');
var ImageResizeMode = require('ImageResizeMode');
var ImageStylePropTypes = require('ImageStylePropTypes');
var React = require('React');
var ReactIOSViewAttributes = require('ReactIOSViewAttributes');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');

var createReactIOSNativeComponentClass = require('createReactIOSNativeComponentClass');
var flattenStyle = require('flattenStyle');
var insetsDiffer = require('insetsDiffer');
var invariant = require('invariant');
var merge = require('merge');
var warning = require('warning');

/**
 * A react component for displaying different types of images,
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
     * resource (which should be wrapped in the `required('image!name')` function).
     */
    source: PropTypes.shape({
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
    style: StyleSheetPropType(ImageStylePropTypes),
    /**
     * A unique identifier for this element to be used in UI Automation
     * testing scripts.
     */
    testID: PropTypes.string,
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
    validAttributes: ReactIOSViewAttributes.UIView
  },

  render: function() {
    var style = flattenStyle([styles.base, this.props.style]);
    invariant(style, "style must be initialized");
    var source = this.props.source;
    invariant(source, "source must be initialized");
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

    var contentModes = NativeModules.UIManager.UIView.ContentMode;
    var resizeMode;
    if (style.resizeMode === ImageResizeMode.stretch) {
      resizeMode = contentModes.ScaleToFill;
    } else if (style.resizeMode === ImageResizeMode.contain) {
      resizeMode = contentModes.ScaleAspectFit;
    } else { // ImageResizeMode.cover or undefined
      resizeMode = contentModes.ScaleAspectFill;
    }

    var nativeProps = merge(this.props, {
      style,
      resizeMode,
      tintColor: style.tintColor,
    });

    if (isStored) {
      nativeProps.imageTag = source.uri;
    } else {
      nativeProps.src = source.uri;
    }
    return <RawImage {...nativeProps} />;
  }
});

var styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

var CommonImageViewAttributes = merge(ReactIOSViewAttributes.UIView, {
  accessible: true,
  accessibilityLabel: true,
  capInsets: {diff: insetsDiffer}, // UIEdgeInsets=UIEdgeInsetsZero
  imageTag: true,
  resizeMode: true,
  src: true,
  testID: PropTypes.string,
});

var RCTStaticImage = createReactIOSNativeComponentClass({
  validAttributes: merge(CommonImageViewAttributes, { tintColor: true }),
  uiViewClassName: 'RCTStaticImage',
});

var RCTNetworkImage = createReactIOSNativeComponentClass({
  validAttributes: merge(CommonImageViewAttributes, { defaultImageSrc: true }),
  uiViewClassName: 'RCTNetworkImageView',
});

module.exports = Image;
