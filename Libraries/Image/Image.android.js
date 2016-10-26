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

var NativeMethodsMixin = require('react/lib/NativeMethodsMixin');
var NativeModules = require('NativeModules');
var ImageResizeMode = require('ImageResizeMode');
var ImageStylePropTypes = require('ImageStylePropTypes');
var ViewStylePropTypes = require('ViewStylePropTypes');
var React = require('React');
var ReactNativeViewAttributes = require('ReactNativeViewAttributes');
var StyleSheet = require('StyleSheet');
var StyleSheetPropType = require('StyleSheetPropType');
var View = require('View');

var flattenStyle = require('flattenStyle');
var merge = require('merge');
var requireNativeComponent = require('requireNativeComponent');
var resolveAssetSource = require('resolveAssetSource');
var Set = require('Set');
var filterObject = require('fbjs/lib/filterObject');

var PropTypes = React.PropTypes;
var {
  ImageLoader,
} = NativeModules;

let _requestId = 1;
function generateRequestId() {
  return _requestId++;
}

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
  resizeMethod: true,
  resizeMode: true,
  progressiveRenderingEnabled: true,
  fadeDuration: true,
  shouldNotifyLoadEvents: true,
});

var ViewStyleKeys = new Set(Object.keys(ViewStylePropTypes));
var ImageSpecificStyleKeys = new Set(Object.keys(ImageStylePropTypes).filter(x => !ViewStyleKeys.has(x)));

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
    /**
     * The mechanism that should be used to resize the image when the image's dimensions
     * differ from the image view's dimensions. Defaults to `auto`.
     *
     * - `auto`: Use heuristics to pick between `resize` and `scale`.
     *
     * - `resize`: A software operation which changes the encoded image in memory before it
     * gets decoded. This should be used instead of `scale` when the image is much larger
     * than the view.
     *
     * - `scale`: The image gets drawn downscaled or upscaled. Compared to `resize`, `scale` is
     * faster (usually hardware accelerated) and produces higher quality images. This
     * should be used if the image is smaller than the view. It should also be used if the
     * image is slightly bigger than the view.
     *
     * More details about `resize` and `scale` can be found at http://frescolib.org/docs/resizing-rotating.html.
     *
     * @platform android
     */
    resizeMethod: PropTypes.oneOf(['auto', 'resize', 'scale']),
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
     *
     * 'center': Scale the image down so that it is completely visible,
     * if bigger than the area of the view.
     * The image will not be scaled up.
     */
    resizeMode: PropTypes.oneOf(['cover', 'contain', 'stretch', 'center']),
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
    prefetch(url: string, callback: ?Function) {
      const requestId = generateRequestId();
      callback && callback(requestId);
      return ImageLoader.prefetchImage(url, requestId);
    },

    /**
     * Abort prefetch request
     */
    abortPrefetch(requestId: number) {
      ImageLoader.abortRequest(requestId);
    },

    /**
     * Perform cache interrogation.
     *
     * @param urls the list of image URLs to check the cache for.
     * @return a mapping from url to cache status, such as "disk" or "memory". If a requested URL is
     *         not in the mapping, it means it's not in the cache.
     */
    async queryCache(urls: Array<string>): Promise<Map<string, 'memory' | 'disk'>> {
      return await ImageLoader.queryCache(urls);
    }
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
        const containerStyle = filterObject(style, (val, key) => !ImageSpecificStyleKeys.has(key));
        const imageStyle = filterObject(style, (val, key) => ImageSpecificStyleKeys.has(key));
        const imageProps = merge(nativeProps, {
          style: [imageStyle, styles.absoluteImage],
          children: undefined,
        });

        return (
          <View style={containerStyle}>
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
    shouldNotifyLoadEvents: true,
  },
};
var RKImage = requireNativeComponent('RCTImageView', Image, cfg);
var RCTTextInlineImage = requireNativeComponent('RCTTextInlineImage', Image, cfg);

module.exports = Image;
