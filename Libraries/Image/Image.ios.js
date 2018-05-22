/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow
 * @format
 */
'use strict';

const ImageProps = require('ImageProps');
const NativeMethodsMixin = require('NativeMethodsMixin');
const NativeModules = require('NativeModules');
const React = require('React');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const StyleSheet = require('StyleSheet');

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
  propTypes: ImageProps,

  statics: {
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
