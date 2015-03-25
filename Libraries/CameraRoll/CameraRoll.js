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
var invariant = require('invariant');

var GROUP_TYPES_OPTIONS = [
  'Album',
  'All',
  'Event',
  'Faces',
  'Library',
  'PhotoStream',
  'SavedPhotos', // default
];

// Flow treats Object and Array as disjoint types, currently.
deepFreezeAndThrowOnMutationInDev((GROUP_TYPES_OPTIONS: any));

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

class CameraRoll {
  /**
   * Saves the image with tag `tag` to the camera roll.
   *
   * @param {string} tag - Can be any of the three kinds of tags we accept:
   *                       1. URL
   *                       2. assets-library tag
   *                       3. tag returned from storing an image in memory
   */
  static saveImageWithTag(tag, successCallback, errorCallback) {
    invariant(
      typeof tag === 'string',
      'CameraRoll.saveImageWithTag tag must be a valid string.'
    );
    RCTCameraRollManager.saveImageWithTag(
      tag,
      (imageTag) => {
        successCallback && successCallback(imageTag);
      },
      (errorMessage) => {
        errorCallback && errorCallback(errorMessage);
      });
  }

  /**
   *  Invokes `callback` with photo identifier objects from the local camera
   *  roll of the device matching shape defined by `getPhotosReturnChecker`.
   *
   *  @param {object} params - See `getPhotosParamChecker`.
   *  @param {function} callback - Invoked with arg of shape defined by
   *    `getPhotosReturnChecker` on success.
   *  @param {function} errorCallback - Invoked with error message on error.
   */
  static getPhotos(params, callback, errorCallback) {
    var metaCallback = callback;
    if (__DEV__) {
      getPhotosParamChecker({params}, 'params', 'CameraRoll.getPhotos');
      invariant(
        typeof callback === 'function',
        'CameraRoll.getPhotos callback must be a valid function.'
      );
      invariant(
        typeof errorCallback === 'function',
        'CameraRoll.getPhotos errorCallback must be a valid function.'
      );
    }
    if (__DEV__) {
      metaCallback = (response) => {
        getPhotosReturnChecker(
          {response},
          'response',
          'CameraRoll.getPhotos callback'
        );
        callback(response);
      };
    }
    RCTCameraRollManager.getPhotos(params, metaCallback, errorCallback);
  }
}

CameraRoll.GroupTypesOptions = GROUP_TYPES_OPTIONS;

module.exports = CameraRoll;
