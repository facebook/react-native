/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule CameraRoll
 * @flow
 */
'use strict';

var ReactPropTypes = require('React').PropTypes
var RCTCameraRollManager = require('NativeModules').CameraRollManager;

var createStrictShapeTypeChecker = require('createStrictShapeTypeChecker');
var deepFreezeAndThrowOnMutationInDev =
  require('deepFreezeAndThrowOnMutationInDev');
var invariant = require('fbjs/lib/invariant');

var GROUP_TYPES_OPTIONS = [
  'Album',
  'All',
  'Event',
  'Faces',
  'Library',
  'PhotoStream',
  'SavedPhotos', // default
];

var ASSET_TYPE_OPTIONS = [
  'All',
  'Videos',
  'Photos', // default
];

// Flow treats Object and Array as disjoint types, currently.
deepFreezeAndThrowOnMutationInDev((GROUP_TYPES_OPTIONS: any));
deepFreezeAndThrowOnMutationInDev((ASSET_TYPE_OPTIONS: any));

/**
 * Shape of the param arg for the `getPhotos` function.
 */
var getPhotosParamChecker = createStrictShapeTypeChecker({
  /**
   * The number of photos wanted in reverse order of the photo application
   * (i.e. most recent first for SavedPhotos).
   */
  first: ReactPropTypes.number.isRequired,

  /**
   * A cursor that matches `page_info { end_cursor }` returned from a previous
   * call to `getPhotos`
   */
  after: ReactPropTypes.string,

  /**
   * Specifies which group types to filter the results to.
   */
  groupTypes: ReactPropTypes.oneOf(GROUP_TYPES_OPTIONS),

  /**
   * Specifies filter on group names, like 'Recent Photos' or custom album
   * titles.
   */
  groupName: ReactPropTypes.string,

  /**
  * Specifies filter on asset type
  */
  assetType: ReactPropTypes.oneOf(ASSET_TYPE_OPTIONS),

  /**
   * Filter by mimetype (e.g. image/jpeg).
   */
  mimeTypes: ReactPropTypes.arrayOf(ReactPropTypes.string),
});

/**
 * Shape of the return value of the `getPhotos` function.
 */
var getPhotosReturnChecker = createStrictShapeTypeChecker({
  edges: ReactPropTypes.arrayOf(createStrictShapeTypeChecker({
    node: createStrictShapeTypeChecker({
      type: ReactPropTypes.string.isRequired,
      group_name: ReactPropTypes.string.isRequired,
      image: createStrictShapeTypeChecker({
        uri: ReactPropTypes.string.isRequired,
        height: ReactPropTypes.number.isRequired,
        width: ReactPropTypes.number.isRequired,
        isStored: ReactPropTypes.bool,
      }).isRequired,
      timestamp: ReactPropTypes.number.isRequired,
      location: createStrictShapeTypeChecker({
        latitude: ReactPropTypes.number,
        longitude: ReactPropTypes.number,
        altitude: ReactPropTypes.number,
        heading: ReactPropTypes.number,
        speed: ReactPropTypes.number,
      }),
    }).isRequired,
  })).isRequired,
  page_info: createStrictShapeTypeChecker({
    has_next_page: ReactPropTypes.bool.isRequired,
    start_cursor: ReactPropTypes.string,
    end_cursor: ReactPropTypes.string,
  }).isRequired,
});

/**
 * `CameraRoll` provides access to the local camera roll / gallery.
 * Before using this you must link the `RCTCameraRoll` library.
 * You can refer to [Linking](docs/linking-libraries-ios.html) for help.
 *
 * ### Permissions
 * The user's permission is required in order to access the Camera Roll on devices running iOS 10 or later.
 * Fill out the `NSCameraUsageDescription` key in your `Info.plist` with a string that describes how your
 * app will use this data. This key will appear as `Privacy - Camera Usage Description` in Xcode.
 *
 */
class CameraRoll {

  static GroupTypesOptions: Array<string>;
  static AssetTypeOptions: Array<string>;

  static saveImageWithTag(tag: string): Promise<Object> {
    console.warn('CameraRoll.saveImageWithTag is deprecated. Use CameraRoll.saveToCameraRoll instead');
    return this.saveToCameraRoll(tag, 'photo');
  }

  /**
   * Saves the photo or video to the camera roll / gallery.
   *
   * On Android, the tag must be a local image or video URI, such as `"file:///sdcard/img.png"`.
   *
   * On iOS, the tag can be any image URI (including local, remote asset-library and base64 data URIs)
   * or a local video file URI (remote or data URIs are not supported for saving video at this time).
   *
   * If the tag has a file extension of .mov or .mp4, it will be inferred as a video. Otherwise
   * it will be treated as a photo. To override the automatic choice, you can pass an optional
   * `type` parameter that must be one of 'photo' or 'video'.
   *
   * Returns a Promise which will resolve with the new URI.
   */
  static saveToCameraRoll(tag: string, type?: 'photo' | 'video'): Promise<Object> {
    invariant(
      typeof tag === 'string',
      'CameraRoll.saveToCameraRoll must be a valid string.'
    );

    invariant(
      type === 'photo' || type === 'video' || type === undefined,
      // $FlowFixMe(>=0.28.0)
      `The second argument to saveToCameraRoll must be 'photo' or 'video'. You passed ${type}`
    );

    let mediaType = 'photo';
    if (type) {
      mediaType = type;
    } else if (['mov', 'mp4'].indexOf(tag.split('.').slice(-1)[0]) >= 0) {
      mediaType = 'video';
    }

    return RCTCameraRollManager.saveToCameraRoll(tag, mediaType);
  }

  /**
   * Returns a Promise with photo identifier objects from the local camera
   * roll of the device matching shape defined by `getPhotosReturnChecker`.
   *
   * @param {object} params See `getPhotosParamChecker`.
   *
   * Returns a Promise which when resolved will be of shape `getPhotosReturnChecker`.
   */
  static getPhotos(params) {
    if (__DEV__) {
      getPhotosParamChecker({params}, 'params', 'CameraRoll.getPhotos');
    }
    if (arguments.length > 1) {
      console.warn('CameraRoll.getPhotos(tag, success, error) is deprecated.  Use the returned Promise instead');
      let successCallback = arguments[1];
      if (__DEV__) {
        const callback = arguments[1];
        successCallback = (response) => {
          getPhotosReturnChecker(
            {response},
            'response',
            'CameraRoll.getPhotos callback'
          );
          callback(response);
        };
      }
      const errorCallback = arguments[2] || ( () => {} );
      RCTCameraRollManager.getPhotos(params).then(successCallback, errorCallback);
    }
    // TODO: Add the __DEV__ check back in to verify the Promise result
    return RCTCameraRollManager.getPhotos(params);
  }
}

CameraRoll.GroupTypesOptions = GROUP_TYPES_OPTIONS;
CameraRoll.AssetTypeOptions = ASSET_TYPE_OPTIONS;

module.exports = CameraRoll;
