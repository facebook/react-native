/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @providesModule DeviceInfo
 */
'use strict';

var RCTDeviceInfo = require('NativeModules').DeviceInfoModule;

/**
 * `DeviceInfo` gives you information about your running application and the
 * device you are running on.
 *
 * #### Device Name on Android
 *
 * If you want to get the device name on Android then you will need to add the
 * bluetooth permission to your application's `AndroidManifest.xml` file.
 *
 * ```
 * <uses-permission android:name="android.permission.BLUETOOTH"/>
 * ```
 */
var DeviceInfo = {
  /**
   *  Return a unique ID for the current device (this is the IDFV on iOS so it will change if all apps from the current apps vendor have been previously uninstalled)
   */
  UniqueID: RCTDeviceInfo.UniqueID,
  /**
   *  Return a system identifier for the type of device e.g. iPhone7,2 or the board on Android e.g. goldfish
   */
  DeviceID: RCTDeviceInfo.DeviceID,
  /**
   *  Return the device manufacturer e.g. Apple
   */
  Manufacturer: RCTDeviceInfo.Manufacturer,
  /**
   *  Return a user friendly device model e.g. iPad Air 2
   */
  Model: RCTDeviceInfo.Model,
  /**
   *  Return the name of the operating system running on the device e.g. iPhone OS
   */
  SystemName: RCTDeviceInfo.SystemName,
  /**
   *  Return the version of the operating system running on the device e.g. 9.0
   */
  SystemVersion: RCTDeviceInfo.SystemVersion,
  /**
   *  Return the application's bundle identifier e.g. com.facebook.internal.uiexplorer.local
   */
  PackageName: RCTDeviceInfo.PackageName,
  /**
   *  Return the build number for the running application e.g. 1
   */
  BuildNumber: RCTDeviceInfo.BuildNumber,
  /**
   *  Return the version for the running application e.g. 1.0
   */
  Version: RCTDeviceInfo.AppVersion,
  /**
   *  Return the name of the current device e.g. Becca's iPhone 6
   */
  DeviceName: RCTDeviceInfo.DeviceName,
  /**
   *  Return the current device's user agent e.g. Dalvik/2.1.0 (Linux; U; Android 5.1; Google Nexus 4 - 5.1.0 - API 22 - 768x1280 Build/LMY47D)
   */
  UserAgent: RCTDeviceInfo.UserAgent,
  /**
   *  Return the current device's locale e.g. en-US
   */
  DeviceLocale: RCTDeviceInfo.DeviceLocale,
  /**
   *  Return the current device's country as a ISO_3166-1 string e.g. US
   */
  DeviceCountry: RCTDeviceInfo.DeviceCountry,
};

module.exports = DeviceInfo;
