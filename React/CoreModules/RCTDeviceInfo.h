/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
<<<<<<< HEAD:React/Modules/RCTDeviceInfo.h
#import <React/RCTBridgeModule.h>
#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
NSDictionary *RCTExportedDimensions(RCTBridge *bridge);
#else
NSDictionary *RCTExportedDimensions(RCTPlatformView *rootView);
#endif // ]TODO(macOS ISS#2323203)
=======
>>>>>>> fb/0.62-stable:React/CoreModules/RCTDeviceInfo.h

@interface RCTDeviceInfo : NSObject <RCTBridgeModule>

@end
