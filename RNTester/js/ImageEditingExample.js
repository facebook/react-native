/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @format
 * @flow
 */
'use strict';

const React = require('react');
const ReactNative = require('react-native');
const {
  CameraRoll,
  Image,
  ImageEditor,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableHighlight,
  View,
} = ReactNative;

const PAGE_SIZE = 20;

type ImageOffset = {|
  x: number,
  y: number,
|};

type ImageSize = {|
  width: number,
  height: number,
|};

type ImageCropData = {|
  offset: ImageOffset,
  size: ImageSize,
  displaySize?: ?ImageSize,
  resizeMode?: ?any,
|};

class SquareImageCropper extends React.Component<
  $FlowFixMeProps,
  $FlowFixMeState,
> {
  state: any;
  _isMounted: boolean;
  _transformData: ImageCropData;

  /* $FlowFixMe(>=0.85.0 site=react_native_fb) This comment suppresses an error
   * found when Flow v0.85 was deployed. To see the error, delete this comment
   * and run Flow. */
  constructor(props) {
    super(props);
    this._isMounted = true;
    this.state = {
      randomPhoto: null,
      measuredSize: null,
      croppedImageURI: null,
      cropError: null,
    };
    this._fetchRandomPhoto();
  }

  async _fetchRandomPhoto() {
    try {
      const data = await CameraRoll.getPhotos({first: PAGE_SIZE});
      if (!this._isMounted) {
        return;
      }
      const edges = data.edges;
      const edge = edges[Math.floor(Math.random() * edges.length)];
      const randomPhoto = edge && edge.node && edge.node.image;
      if (randomPhoto) {
        this.setState({randomPhoto});
      }
    } catch (error) {
      console.warn("Can't get a photo from camera roll", error);
    }
  }

  componentWillUnmount() {
    this._isMounted = false;
  }

  render() {
    if (!this.state.measuredSize) {
      return (
        <View
          style={styles.container}
          onLayout={event => {
            const measuredWidth = event.nativeEvent.layout.width;
            if (!measuredWidth) {
              return;
            }
            this.setState({
              measuredSize: {width: measuredWidth, height: measuredWidth},
            });
          }}
        />
      );
    }

    if (!this.state.croppedImageURI) {
      return this._renderImageCropper();
    }
    return this._renderCroppedImage();
  }

  _renderImageCropper() {
    if (!this.state.randomPhoto) {
      return <View style={styles.container} />;
    }
    let error = null;
    if (this.state.cropError) {
      error = <Text>{this.state.cropError.message}</Text>;
    }
    return (
      <View style={styles.container}>
        <Text>Drag the image within the square to crop:</Text>
        <ImageCropper
          image={this.state.randomPhoto}
          size={this.state.measuredSize}
          style={[styles.imageCropper, this.state.measuredSize]}
          onTransformDataChange={data => (this._transformData = data)}
        />
        <TouchableHighlight
          style={styles.cropButtonTouchable}
          onPress={this._crop.bind(this)}>
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Crop</Text>
          </View>
        </TouchableHighlight>
        {error}
      </View>
    );
  }

  _renderCroppedImage() {
    return (
      <View style={styles.container}>
        <Text>Here is the cropped image:</Text>
        <Image
          source={{uri: this.state.croppedImageURI}}
          style={[styles.imageCropper, this.state.measuredSize]}
        />
        <TouchableHighlight
          style={styles.cropButtonTouchable}
          onPress={this._reset.bind(this)}>
          <View style={styles.cropButton}>
            <Text style={styles.cropButtonLabel}>Try again</Text>
          </View>
        </TouchableHighlight>
      </View>
    );
  }

  _crop() {
    ImageEditor.cropImage(
      this.state.randomPhoto.uri,
      this._transformData,
      croppedImageURI => this.setState({croppedImageURI}),
      cropError => this.setState({cropError}),
    );
  }

  _reset() {
    this.setState({
      randomPhoto: null,
      croppedImageURI: null,
      cropError: null,
    });
    this._fetchRandomPhoto();
  }
}

class ImageCropper extends React.Component<$FlowFixMeProps, $FlowFixMeState> {
  _contentOffset: ImageOffset;
  _maximumZoomScale: number;
  _minimumZoomScale: number;
  _scaledImageSize: ImageSize;
  _horizontal: boolean;

  UNSAFE_componentWillMount() {
    // Scale an image to the minimum size that is large enough to completely
    // fill the crop box.
    const widthRatio = this.props.image.width / this.props.size.width;
    const heightRatio = this.props.image.height / this.props.size.height;
    this._horizontal = widthRatio > heightRatio;
    if (this._horizontal) {
      this._scaledImageSize = {
        width: this.props.image.width / heightRatio,
        height: this.props.size.height,
      };
    } else {
      this._scaledImageSize = {
        width: this.props.size.width,
        height: this.props.image.height / widthRatio,
      };
      if (Platform.OS === 'android') {
        // hack to work around Android ScrollView a) not supporting zoom, and
        // b) not supporting vertical scrolling when nested inside another
        // vertical ScrollView (which it is, when displayed inside UIExplorer)
        this._scaledImageSize.width *= 2;
        this._scaledImageSize.height *= 2;
        this._horizontal = true;
      }
    }
    this._contentOffset = {
      x: (this._scaledImageSize.width - this.props.size.width) / 2,
      y: (this._scaledImageSize.height - this.props.size.height) / 2,
    };
    this._maximumZoomScale = Math.min(
      this.props.image.width / this._scaledImageSize.width,
      this.props.image.height / this._scaledImageSize.height,
    );
    this._minimumZoomScale = Math.max(
      this.props.size.width / this._scaledImageSize.width,
      this.props.size.height / this._scaledImageSize.height,
    );
    this._updateTransformData(
      this._contentOffset,
      this._scaledImageSize,
      this.props.size,
    );
  }

  _onScroll(event) {
    this._updateTransformData(
      event.nativeEvent.contentOffset,
      event.nativeEvent.contentSize,
      event.nativeEvent.layoutMeasurement,
    );
  }

  _updateTransformData(offset, scaledImageSize, croppedImageSize) {
    const offsetRatioX = offset.x / scaledImageSize.width;
    const offsetRatioY = offset.y / scaledImageSize.height;
    const sizeRatioX = croppedImageSize.width / scaledImageSize.width;
    const sizeRatioY = croppedImageSize.height / scaledImageSize.height;

    const cropData: ImageCropData = {
      offset: {
        x: this.props.image.width * offsetRatioX,
        y: this.props.image.height * offsetRatioY,
      },
      size: {
        width: this.props.image.width * sizeRatioX,
        height: this.props.image.height * sizeRatioY,
      },
    };
    this.props.onTransformDataChange &&
      this.props.onTransformDataChange(cropData);
  }

  render() {
    return (
      <ScrollView
        alwaysBounceVertical={true}
        automaticallyAdjustContentInsets={false}
        contentOffset={this._contentOffset}
        decelerationRate="fast"
        horizontal={this._horizontal}
        maximumZoomScale={this._maximumZoomScale}
        minimumZoomScale={this._minimumZoomScale}
        onMomentumScrollEnd={this._onScroll.bind(this)}
        onScrollEndDrag={this._onScroll.bind(this)}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        style={this.props.style}
        scrollEventThrottle={16}>
        <Image source={this.props.image} style={this._scaledImageSize} />
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignSelf: 'stretch',
  },
  imageCropper: {
    alignSelf: 'center',
    marginTop: 12,
  },
  cropButtonTouchable: {
    alignSelf: 'center',
    marginTop: 12,
  },
  cropButton: {
    padding: 12,
    backgroundColor: 'blue',
    borderRadius: 4,
  },
  cropButtonLabel: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
});

exports.framework = 'React';
exports.title = 'ImageEditor';
exports.description = 'Cropping and scaling with ImageEditor';
exports.examples = [
  {
    title: 'Image Cropping',
    render() {
      return <SquareImageCropper />;
    },
  },
];
