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
  ActivityIndicator,
  Alert,
  CameraRoll,
  Image,
  FlatList,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  View,
} = ReactNative;

const logError = require('logError');

import type {
  PhotoIdentifier,
  PhotoIdentifiersPage,
  GetPhotosParams,
} from 'CameraRoll';

type Props = $ReadOnly<{|
  /**
   * The group where the photos will be fetched from. Possible
   * values are 'Album', 'All', 'Event', 'Faces', 'Library', 'PhotoStream'
   * and SavedPhotos.
   */
  groupTypes:
    | 'Album'
    | 'All'
    | 'Event'
    | 'Faces'
    | 'Library'
    | 'PhotoStream'
    | 'SavedPhotos',

  /**
   * Number of images that will be fetched in one page.
   */
  batchSize: number,

  /**
   * A function that takes a single image as a parameter and renders it.
   */
  renderImage: PhotoIdentifier => React.Node,

  /**
   * A boolean that indicates if we should render large or small images.
   */
  bigImages: Boolean,

  /**
   * The asset type, one of 'Photos', 'Videos' or 'All'
   */
  assetType: 'Photos' | 'Videos' | 'All',
|}>;

type State = {|
  assets: Array<PhotoIdentifier>,
  lastCursor: ?string,
  noMore: boolean,
  loadingMore: boolean,
|};

type Row = {
  item: PhotoIdentifier,
};

class CameraRollView extends React.Component<Props, State> {
  static defaultProps = {
    groupTypes: 'SavedPhotos',
    batchSize: 5,
    assetType: 'Photos',
    renderImage: function(asset: PhotoIdentifier) {
      const imageSize = 150;
      const imageStyle = [styles.image, {width: imageSize, height: imageSize}];
      return <Image source={asset.node.image} style={imageStyle} />;
    },
  };

  state = this.getInitialState();

  getInitialState() {
    return {
      assets: [],
      lastCursor: null,
      noMore: false,
      loadingMore: false,
    };
  }

  componentDidMount() {
    this.fetch();
  }

  UNSAFE_componentWillReceiveProps(nextProps: Props) {
    if (this.props.groupTypes !== nextProps.groupTypes) {
      this.fetch(true);
    }
  }

  async _fetch(clear?: boolean) {
    if (clear) {
      this.setState(this.getInitialState(), this.fetch);
      return;
    }

    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Permission Explanation',
          message: 'RNTester would like to access your pictures.',
        },
      );
      if (result !== 'granted') {
        Alert.alert('Access to pictures was denied.');
        return;
      }
    }

    const fetchParams: GetPhotosParams = {
      first: this.props.batchSize,
      groupTypes: this.props.groupTypes,
      assetType: this.props.assetType,
    };
    if (Platform.OS === 'android') {
      // not supported in android
      delete fetchParams.groupTypes;
    }
    if (this.state.lastCursor) {
      fetchParams.after = this.state.lastCursor;
    }

    try {
      const data = await CameraRoll.getPhotos(fetchParams);
      this._appendAssets(data);
    } catch (e) {
      logError(e);
    }
  }

  /**
   * Fetches more images from the camera roll. If clear is set to true, it will
   * set the component to its initial state and re-fetch the images.
   */
  fetch = (clear?: boolean) => {
    if (!this.state.loadingMore) {
      this.setState({loadingMore: true}, () => {
        this._fetch(clear);
      });
    }
  };

  render() {
    return (
      <FlatList
        renderItem={this._renderRow}
        ListFooterComponent={this._renderFooterSpinner}
        onEndReached={this._onEndReached}
        style={styles.container}
        data={this.state.assets}
        extraData={this.props.bigImages}
      />
    );
  }

  _renderFooterSpinner = () => {
    if (!this.state.noMore) {
      return <ActivityIndicator />;
    }
    return null;
  };

  _renderRow = (row: Row) => {
    return <View style={styles.row}>{this.props.renderImage(row.item)}</View>;
  };

  _appendAssets(data: PhotoIdentifiersPage) {
    const assets = data.edges;
    const newState: $Shape<State> = {loadingMore: false};

    if (!data.page_info.has_next_page) {
      newState.noMore = true;
    }

    if (assets.length > 0) {
      newState.lastCursor = data.page_info.end_cursor;
      newState.assets = this.state.assets.concat(assets);
    }

    this.setState(newState);
  }

  _onEndReached = () => {
    if (!this.state.noMore) {
      this.fetch();
    }
  };
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    flex: 1,
  },
  image: {
    margin: 4,
  },
  container: {
    flex: 1,
  },
});

module.exports = CameraRollView;
