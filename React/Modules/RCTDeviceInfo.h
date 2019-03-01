/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
NSDictionary *RCTExportedDimensions(RCTBridge *bridge);
#else
NSDictionary *RCTExportedDimensions(RCTPlatformView *rootView);
#endif // ]TODO(macOS ISS#2323203)

@interface RCTDeviceInfo : NSObject <RCTBridgeModule, RCTInvalidating>

@end
