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

const ImageStylePropTypes = require('ImageStylePropTypes');
const NativeMethodsMixin = require('NativeMethodsMixin');
const NativeModules = require('NativeModules');
const React = require('React');
const PropTypes = require('prop-types');
const ReactNativeViewAttributes = require('ReactNativeViewAttributes');
const StyleSheet = require('StyleSheet');
const StyleSheetPropType = require('StyleSheetPropType');
const TextAncestor = require('TextAncestor');
const ViewPropTypes = require('ViewPropTypes');

const createReactClass = require('create-react-class');
const flattenStyle = require('flattenStyle');
const merge = require('merge');
const requireNativeComponent = require('requireNativeComponent');
const resolveAssetSource = require('resolveAssetSource');

const {ImageLoader} = NativeModules;

let _requestId = 1;
function generateRequestId() {
  return _requestId++;
}

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
    ...ViewPropTypes,
    style: StyleSheetPropType(ImageStylePropTypes),
    /**
     * See https://facebook.github.io/react-native/docs/image.html#source
     */
    source: PropTypes.oneOfType([
      PropTypes.shape({
        uri: PropTypes.string,
        headers: PropTypes.objectOf(PropTypes.string),
      }),
      // Opaque type returned by require('./image.jpg')
      PropTypes.number,
      // Multiple sources
      PropTypes.arrayOf(
        PropTypes.shape({
          uri: PropTypes.string,
          width: PropTypes.number,
          height: PropTypes.number,
          headers: PropTypes.objectOf(PropTypes.string),
        }),
      ),
    ]),
    /**
     * blurRadius: the blur radius of the blur filter added to the image
     *
     * See https://facebook.github.io/react-native/docs/image.html#blurradius
     */
    blurRadius: PropTypes.number,
    /**
     * See https://facebook.github.io/react-native/docs/image.html#defaultsource
     */
    defaultSource: PropTypes.number,
    /**
     * See https://facebook.github.io/react-native/docs/image.html#loadingindicatorsource
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
     * Invoked on load error
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
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID: PropTypes.string,
    /**
     * The mechanism that should be used to resize the image when the image's dimensions
     * differ from the image view's dimensions. Defaults to `auto`.
     *
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
  },

  statics: {
    getSize(
      url: string,
      success: (width: number, height: number) => void,
      failure?: (error: any) => void,
    ) {
      return ImageLoader.getSize(url)
        .then(function(sizes) {
          success(sizes.width, sizes.height);
        })
        .catch(
          failure ||
            function() {
              console.warn('Failed to get size for image: ' + url);
            },
        );
    },

    /**
     * Prefetches a remote image for later use by downloading it to the disk
     * cache
     *
     * See https://facebook.github.io/react-native/docs/image.html#prefetch
     */
    prefetch(url: string, callback: ?Function) {
      const requestId = generateRequestId();
      callback && callback(requestId);
      return ImageLoader.prefetchImage(url, requestId);
    },

    /**
     * Abort prefetch request.
     *
     * See https://facebook.github.io/react-native/docs/image.html#abortprefetch
     */
    abortPrefetch(requestId: number) {
      ImageLoader.abortRequest(requestId);
    },

    /**
     * Perform cache interrogation.
     *
     * See https://facebook.github.io/react-native/docs/image.html#querycache
     */
    async queryCache(
      urls: Array<string>,
    ): Promise<Map<string, 'memory' | 'disk'>> {
      return await ImageLoader.queryCache(urls);
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
    uiViewClassName: 'RCTView',
    validAttributes: ReactNativeViewAttributes.RCTView,
  },

  render: function() {
    const source = resolveAssetSource(this.props.source);
    const defaultSource = resolveAssetSource(this.props.defaultSource);
    const loadingIndicatorSource = resolveAssetSource(
      this.props.loadingIndicatorSource,
    );

    // As opposed to the ios version, here we render `null` when there is no source, source.uri
    // or source array.

    if (source && source.uri === '') {
      console.warn('source.uri should not be an empty string');
    }

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

    if (this.props.defaultSource && this.props.loadingIndicatorSource) {
      throw new Error(
        'The <Image> component cannot have defaultSource and loadingIndicatorSource at the same time. Please use either defaultSource or loadingIndicatorSource.',
      );
    }

    if (!source || (!source.uri && !Array.isArray(source))) {
      return null;
    }

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

    const {onLoadStart, onLoad, onLoadEnd, onError} = this.props;
    const nativeProps = merge(this.props, {
      style,
      shouldNotifyLoadEvents: !!(onLoadStart || onLoad || onLoadEnd || onError),
      src: sources,
      headers: source.headers,
      defaultSrc: defaultSource ? defaultSource.uri : null,
      loadingIndicatorSrc: loadingIndicatorSource
        ? loadingIndicatorSource.uri
        : null,
    });

    return (
      <TextAncestor.Consumer>
        {hasTextAncestor =>
          hasTextAncestor ? (
            <RCTTextInlineImage {...nativeProps} />
          ) : (
            <RKImage {...nativeProps} />
          )
        }
      </TextAncestor.Consumer>
    );
  },
});

const styles = StyleSheet.create({
  base: {
    overflow: 'hidden',
  },
});

const cfg = {
  nativeOnly: {
    src: true,
    headers: true,
    defaultSrc: true,
    loadingIndicatorSrc: true,
    shouldNotifyLoadEvents: true,
  },
};
const RKImage = requireNativeComponent('RCTImageView', Image, cfg);
const RCTTextInlineImage = requireNativeComponent(
  'RCTTextInlineImage',
  Image,
  cfg,
);

module.exports = Image;
