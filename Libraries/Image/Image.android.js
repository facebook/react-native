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

var flattenStyle = require('flattenStyle');
var merge = require('merge');
var requireNativeComponent = require('requireNativeComponent');
var resolveAssetSource = require('resolveAssetSource');

var {
  ImageLoader,
} = NativeModules;

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
 *           source={require('./myIcon.png')}
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
  loadingIndicatorSrc: true,
  resizeMode: true,
  progressiveRenderingEnabled: true,
  fadeDuration: true,
  shouldNotifyLoadEvents: true,
});

var Image = React.createClass({
  propTypes: {
    ...View.propTypes,
    style: StyleSheetPropType(ImageStylePropTypes),
   /**
     * `uri` is a string representing the resource identifier for the image, which
     * could be an http address, a local file path, or a static image
     * resource (which should be wrapped in the `require('./path/to/image.png')` function).
     * This prop can also contain several remote `uri`, specified together with
     * their width and height. The native side will then choose the best `uri` to display
     * based on the measured size of the image container.
     */
    source: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string,
      }),
      // Opaque type returned by require('./image.jpg')
      PropTypes.number,
      // Multiple sources
      PropTypes.arrayOf(
        PropTypes.shape({
          uri: PropTypes.string,
          width: PropTypes.number,
          height: PropTypes.number,
        }))
    ]),
    /**
     * similarly to `source`, this property represents the resource used to render
     * the loading indicator for the image, displayed until image is ready to be
     * displayed, typically after when it got downloaded from network.
     */
    loadingIndicatorSource: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string,
      }),
      // Opaque type returned by require('./image.jpg')
      PropTypes.number,
    ]),
    progressiveRenderingEnabled: PropTypes.bool,
    fadeDuration: PropTypes.number,
    /**
     * Invoked on load start
     */
    onLoadStart: PropTypes.func,
    /**
     * Invoked when load completes successfully
     */
    onLoad: PropTypes.func,
    /**
     * Invoked when load either succeeds or fails
     */
    onLoadEnd: PropTypes.func,
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
  },

  statics: {
    resizeMode: ImageResizeMode,

    getSize(
      url: string,
      success: (width: number, height: number) => void,
      failure: (error: any) => void,
    ) {
      return ImageLoader.getSize(url)
        .then(function(sizes) {
          success(sizes.width, sizes.height);
        })
        .catch(failure || function() {
          console.warn('Failed to get size for image: ' + url);
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
   * make `this` look like an actual native component class. Since it can render
   * as 3 different native components we need to update viewConfig accordingly
   */
  viewConfig: {
    uiViewClassName: 'RCTView',
    validAttributes: ReactNativeViewAttributes.RCTView,
  },

  _updateViewConfig: function(props) {
    if (props.children) {
      this.viewConfig = {
        uiViewClassName: 'RCTView',
        validAttributes: ReactNativeViewAttributes.RCTView,
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

  contextTypes: {
    isInAParentText: React.PropTypes.bool
  },

  render: function() {
    const source = resolveAssetSource(this.props.source);
    const loadingIndicatorSource = resolveAssetSource(this.props.loadingIndicatorSource);

    // As opposed to the ios version, here we render `null` when there is no source, source.uri
    // or source array.

    if (source && source.uri === '') {
      console.warn('source.uri should not be an empty string');
    }

    if (this.props.src) {
      console.warn('The <Image> component requires a `source` property rather than `src`.');
    }

    if (source && (source.uri || Array.isArray(source))) {
      let style;
      let sources;
      if (source.uri) {
        const {width, height} = source;
        style = flattenStyle([{width, height}, styles.base, this.props.style]);
        sources = [{uri: source.uri}];
      } else {
        style = flattenStyle([styles.base, this.props.style]);
        sources = source;
      }

      const {onLoadStart, onLoad, onLoadEnd} = this.props;
      const nativeProps = merge(this.props, {
        style,
        shouldNotifyLoadEvents: !!(onLoadStart || onLoad || onLoadEnd),
        src: sources,
        loadingIndicatorSrc: loadingIndicatorSource ? loadingIndicatorSource.uri : null,
      });

      if (nativeProps.children) {
        // TODO(6033040): Consider implementing this as a separate native component
        const imageProps = merge(nativeProps, {
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
        if (this.context.isInAParentText) {
          return <RCTTextInlineImage {...nativeProps}/>;
        } else {
          return <RKImage {...nativeProps}/>;
        }
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

var cfg = {
  nativeOnly: {
    src: true,
    loadingIndicatorSrc: true,
    defaultImageSrc: true,
    imageTag: true,
    progressHandlerRegistered: true,
    shouldNotifyLoadEvents: true,
  },
};
var RKImage = requireNativeComponent('RCTImageView', Image, cfg);
var RCTTextInlineImage = requireNativeComponent('RCTTextInlineImage', Image, cfg);

module.exports = Image;
