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
 * @format
 */
'use strict';

const EdgeInsetsPropType = require('EdgeInsetsPropType');
const ImageResizeMode = require('ImageResizeMode');
const ImageSourcePropType = require('ImageSourcePropType');
const ImageStylePropTypes = require('ImageStylePropTypes');
const NativeMethodsMixin = require('NativeMethodsMixin');
const NativeModules = require('NativeModules');
const React = require('React');
const PropTypes = require('prop-types');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const StyleSheet = require('StyleSheet');
const StyleSheetPropType = require('StyleSheetPropType');

const createReactClass = require('create-react-class');
const flattenStyle = require('flattenStyle');
const requireNativeComponent = require('requireNativeComponent');
const resolveAssetSource = require('resolveAssetSource');

const ImageViewManager = NativeModules.ImageViewManager;

/**
 * A React component for displaying different types of images,
 * including network images, static resources, temporary local images, and
 * images from local disk, such as the camera roll.
 *
 * See https://facebook.github.io/react-native/docs/image.html
 */
const Image = createReactClass({
  displayName: 'Image',
  propTypes: {
    /**
     * See https://facebook.github.io/react-native/docs/image.html#style
     */
    style: StyleSheetPropType(ImageStylePropTypes),
    /**
     * The image source (either a remote URL or a local file resource).
     *
     * See https://facebook.github.io/react-native/docs/image.html#source
     */
    source: ImageSourcePropType,
    /**
     * A static image to display while loading the image source.
     *
     * See https://facebook.github.io/react-native/docs/image.html#defaultsource
     */
    defaultSource: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string,
        width: PropTypes.number,
        height: PropTypes.number,
        scale: PropTypes.number,
      }),
      PropTypes.number,
    ]),
    /**
     * When true, indicates the image is an accessibility element.
     *
     * See https://facebook.github.io/react-native/docs/image.html#accessible
     */
    accessible: PropTypes.bool,
    /**
     * The text that's read by the screen reader when the user interacts with
     * the image.
     *
     * See https://facebook.github.io/react-native/docs/image.html#accessibilitylabel
     */
    accessibilityLabel: PropTypes.node,
    /**
     * blurRadius: the blur radius of the blur filter added to the image
     *
     * See https://facebook.github.io/react-native/docs/image.html#blurradius
     */
    blurRadius: PropTypes.number,
    /**
     * See https://facebook.github.io/react-native/docs/image.html#capinsets
     */
    capInsets: EdgeInsetsPropType,
    /**
     * See https://facebook.github.io/react-native/docs/image.html#resizemethod
     */
    resizeMethod: PropTypes.oneOf(['auto', 'resize', 'scale']),
    /**
     * Determines how to resize the image when the frame doesn't match the raw
     * image dimensions.
     *
     * See https://facebook.github.io/react-native/docs/image.html#resizemode
     */
    resizeMode: PropTypes.oneOf([
      'cover',
      'contain',
      'stretch',
      'repeat',
      'center',
    ]),
    /**
     * A unique identifier for this element to be used in UI Automation
     * testing scripts.
     *
     * See https://facebook.github.io/react-native/docs/image.html#testid
     */
    testID: PropTypes.string,
    /**
     * Invoked on mount and layout changes with
     * `{nativeEvent: {layout: {x, y, width, height}}}`.
     *
     * See https://facebook.github.io/react-native/docs/image.html#onlayout
     */
    onLayout: PropTypes.func,
    /**
     * Invoked on load start.
     *
     * See https://facebook.github.io/react-native/docs/image.html#onloadstart
     */
    onLoadStart: PropTypes.func,
    /**
     * Invoked on download progress with `{nativeEvent: {loaded, total}}`.
     *
     * See https://facebook.github.io/react-native/docs/image.html#onprogress
     */
    onProgress: PropTypes.func,
    /**
     * Invoked on load error with `{nativeEvent: {error}}`.
     *
     * See https://facebook.github.io/react-native/docs/image.html#onerror
     */
    onError: PropTypes.func,
    /**
     * Invoked when a partial load of the image is complete.
     *
     * See https://facebook.github.io/react-native/docs/image.html#onpartialload
     */
    onPartialLoad: PropTypes.func,
    /**
     * Invoked when load completes successfully.
     *
     * See https://facebook.github.io/react-native/docs/image.html#onload
     */
    onLoad: PropTypes.func,
    /**
     * Invoked when load either succeeds or fails.
     *
     * See https://facebook.github.io/react-native/docs/image.html#onloadend
     */
    onLoadEnd: PropTypes.func,
  },

  statics: {
    resizeMode: ImageResizeMode,
    /**
     * Retrieve the width and height (in pixels) of an image prior to displaying it.
     *
     * See https://facebook.github.io/react-native/docs/image.html#getsize
     */
    getSize: function(
      uri: string,
      success: (width: number, height: number) => void,
      failure?: (error: any) => void,
    ) {
      ImageViewManager.getSize(
        uri,
        success,
        failure ||
          function() {
            console.warn('Failed to get size for image: ' + uri);
          },
      );
    },
    /**
     * Prefetches a remote image for later use by downloading it to the disk
     * cache.
     *
     * See https://facebook.github.io/react-native/docs/image.html#prefetch
     */
    prefetch(url: string) {
      return ImageViewManager.prefetchImage(url);
    },
    /**
     * Resolves an asset reference into an object.
     *
     * See https://facebook.github.io/react-native/docs/image.html#resolveassetsource
     */
    resolveAssetSource: resolveAssetSource,
  },

  mixins: [NativeMethodsMixin],

  /**
   * `NativeMethodsMixin` will look for this when invoking `setNativeProps`. We
   * make `this` look like an actual native component class.
   */
  viewConfig: {
    uiViewClassName: 'UIView',
    validAttributes: ReactNativeViewAttributes.UIView,
  },

  render: function() {
    const source = resolveAssetSource(this.props.source) || {
      uri: undefined,
      width: undefined,
      height: undefined,
    };

    let sources;
    let style;
    if (Array.isArray(source)) {
      style = flattenStyle([styles.base, this.props.style]) || {};
      sources = source;
    } else {
      const {width, height, uri} = source;
      style =
        flattenStyle([{width, height}, styles.base, this.props.style]) || {};
      sources = [source];

      if (uri === '') {
        console.warn('source.uri should not be an empty string');
      }
    }

    const resizeMode =
      this.props.resizeMode || (style || {}).resizeMode || 'cover'; // Workaround for flow bug t7737108
    const tintColor = (style || {}).tintColor; // Workaround for flow bug t7737108

    if (this.props.src) {
      console.warn(
        'The <Image> component requires a `source` property rather than `src`.',
      );
    }

    if (this.props.children) {
      throw new Error(
        'The <Image> component cannot contain children. If you want to render content on top of the image, consider using the <ImageBackground> component or absolute positioning.',
      );
    }

    return (
      <RCTImageView
        {...this.props}
        style={style}
        resizeMode={resizeMode}
        tintColor={tintColor}
        source={sources}
      />
    );
  },
});

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

const RCTImageView = requireNativeComponent('RCTImageView', Image);

module.exports = Image;
