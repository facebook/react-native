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

var ReactPropTypes = require('ReactPropTypes');
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
 */
class CameraRoll {

  static GroupTypesOptions: Array<string>;
  static AssetTypeOptions: Array<string>;
  /**
   * Saves the image to the camera roll / gallery.
   *
   * On Android, the tag is a local URI, such as `"file:///sdcard/img.png"`.
   *
   * On iOS, the tag can be one of the following:
   *
   *   - local URI
   *   - assets-library tag
   *   - a tag not matching any of the above, which means the image data will
   * be stored in memory (and consume memory as long as the process is alive)
   *
   * Returns a Promise which when resolved will be passed the new URI.
   */
  static saveImageWithTag(tag) {
    invariant(
      typeof tag === 'string',
      'CameraRoll.saveImageWithTag tag must be a valid string.'
    );
    if (arguments.length > 1) {
      console.warn('CameraRoll.saveImageWithTag(tag, success, error) is deprecated.  Use the returned Promise instead');
      const successCallback = arguments[1];
      const errorCallback = arguments[2] || ( () => {} );
      RCTCameraRollManager.saveImageWithTag(tag).then(successCallback, errorCallback);
      return;
    }
    return RCTCameraRollManager.saveImageWithTag(tag);
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
