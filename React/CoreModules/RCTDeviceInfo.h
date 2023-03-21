/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>

#if TARGET_OS_OSX // [macOS RCTExportedDimensions is needed in RCTRootContentView
#ifdef __cplusplus
extern "C"
#endif
NSDictionary *RCTExportedDimensions(RCTPlatformView *rootView, RCTBridge *bridge);
#endif // macOS]

@interface RCTDeviceInfo : NSObject <RCTBridgeModule>

@end
