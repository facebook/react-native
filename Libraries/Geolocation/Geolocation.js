/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule Geolocation
 * @flow
 */
'use strict';

const NativeEventEmitter = require('NativeEventEmitter');
const RCTLocationObserver = require('NativeModules').LocationObserver;

const invariant = require('fbjs/lib/invariant');
const logError = require('logError');
/* $FlowFixMe(>=0.54.0 site=react_native_oss) This comment suppresses an error
 * found when Flow v0.54 was deployed. To see the error delete this comment and
 * run Flow. */
const warning = require('fbjs/lib/warning');

const LocationEventEmitter = new NativeEventEmitter(RCTLocationObserver);

const Platform = require('Platform');
const PermissionsAndroid = require('PermissionsAndroid');

var subscriptions = [];
var updatesEnabled = false;

type GeoConfiguration = {
  skipPermissionRequests: bool;
}

type GeoOptions = {
  timeout?: number,
  maximumAge?: number,
  enableHighAccuracy?: bool,
  distanceFilter: number,
  useSignificantChanges?: bool,
}

/**
 * The Geolocation API extends the web spec:
 * https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
 *
 * As a browser polyfill, this API is available through the `navigator.geolocation`
 * global - you do not need to `import` it.
 *
 * ### Configuration and Permissions
 *
 * <div class="banner-crna-ejected">
 *   <h3>Projects with Native Code Only</h3>
 *   <p>
 *     This section only applies to projects made with <code>react-native init</code>
 *     or to those made with Create React Native App which have since ejected. For
 *     more information about ejecting, please see
 *     the <a href="https://github.com/react-community/create-react-native-app/blob/master/EJECTING.md" target="_blank">guide</a> on
 *     the Create React Native App repository.
 *   </p>
 * </div>
 *
 * #### iOS
 * You need to include the `NSLocationWhenInUseUsageDescription` key
 * in Info.plist to enable geolocation when using the app. Geolocation is
 * enabled by default when you create a project with `react-native init`.
 *
 * In order to enable geolocation in the background, you need to include the
 * 'NSLocationAlwaysUsageDescription' key in Info.plist and add location as
 * a background mode in the 'Capabilities' tab in Xcode.
 *
 * #### Android
 * To request access to location, you need to add the following line to your
 * app's `AndroidManifest.xml`:
 *
 * `<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />`
 *
 * Android API >= 18 Positions will also contain a `mocked` boolean to indicate if position
 * was created from a mock provider.
 *
 * <p>
 *   Android API >= 23 Requires an additional step to check for, and request
 *   the ACCESS_FINE_LOCATION permission using
 *   the <a href="https://facebook.github.io/react-native/docs/permissionsandroid.html" target="_blank">PermissionsAndroid API</a>.
 *   Failure to do so may result in a hard crash.
 * </p>
 */
var Geolocation = {

  /*
    * Sets configuration options that will be used in all location requests.
    *
    * ### Options
    *
    * #### iOS
    *
    * - `skipPermissionRequests` - defaults to `false`, if `true` you must request permissions
    * before using Geolocation APIs.
    *
    */
  setRNConfiguration: function(
    config: GeoConfiguration
  ) {
    if (RCTLocationObserver.setConfiguration) {
      RCTLocationObserver.setConfiguration(config);
    }
  },

  /*
   * Request suitable Location permission based on the key configured on pList.
   * If NSLocationAlwaysUsageDescription is set, it will request Always authorization,
   * although if NSLocationWhenInUseUsageDescription is set, it will request InUse
   * authorization.
   */
  requestAuthorization: function() {
    RCTLocationObserver.requestAuthorization();
  },

  /*
   * Invokes the success callback once with the latest location info.  Supported
   * options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool)
   * On Android, if the location is cached this can return almost immediately,
   * or it will request an update which might take a while.
   */
  getCurrentPosition: async function(
    geo_success: Function,
    geo_error?: Function,
    geo_options?: GeoOptions
  ) {
    invariant(
      typeof geo_success === 'function',
      'Must provide a valid geo_success callback.'
    );
    let hasPermission = true;
    // Supports Android's new permission model. For Android older devices,
    // it's always on.
    if (Platform.OS === 'android' && Platform.Version >= 23) {
      hasPermission = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
      );
      if (!hasPermission) {
        const status = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        );
        hasPermission = status === PermissionsAndroid.RESULTS.GRANTED;
      }
    }
    if (hasPermission) {
      RCTLocationObserver.getCurrentPosition(
        geo_options || {},
        geo_success,
        geo_error || logError,
      );
    }
  },

  /*
   * Invokes the success callback whenever the location changes.  Supported
   * options: timeout (ms), maximumAge (ms), enableHighAccuracy (bool), distanceFilter(m), useSignificantChanges (bool)
   */
  watchPosition: function(success: Function, error?: Function, options?: GeoOptions): number {
    if (!updatesEnabled) {
      RCTLocationObserver.startObserving(options || {});
      updatesEnabled = true;
    }
    var watchID = subscriptions.length;
    subscriptions.push([
      LocationEventEmitter.addListener(
        'geolocationDidChange',
        success
      ),
      error ? LocationEventEmitter.addListener(
        'geolocationError',
        error
      ) : null,
    ]);
    return watchID;
  },

  clearWatch: function(watchID: number) {
    var sub = subscriptions[watchID];
    if (!sub) {
      // Silently exit when the watchID is invalid or already cleared
      // This is consistent with timers
      return;
    }

    sub[0].remove();
    // array element refinements not yet enabled in Flow
    var sub1 = sub[1]; sub1 && sub1.remove();
    subscriptions[watchID] = undefined;
    var noWatchers = true;
    for (var ii = 0; ii < subscriptions.length; ii++) {
      if (subscriptions[ii]) {
        noWatchers = false; // still valid subscriptions
      }
    }
    if (noWatchers) {
      Geolocation.stopObserving();
    }
  },

  stopObserving: function() {
    if (updatesEnabled) {
      RCTLocationObserver.stopObserving();
      updatesEnabled = false;
      for (var ii = 0; ii < subscriptions.length; ii++) {
        var sub = subscriptions[ii];
        if (sub) {
          warning(false, 'Called stopObserving with existing subscriptions.');
          sub[0].remove();
          // array element refinements not yet enabled in Flow
          var sub1 = sub[1]; sub1 && sub1.remove();
        }
      }
      subscriptions = [];
    }
  }
};

module.exports = Geolocation;
