/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTBridge.h>

#if TARGET_OS_OSX // [TODO(macOS GH#774) - RCTExportedDimensions is needed in RCTRootContentView
#ifdef __cplusplus
extern "C"
#endif
NSDictionary *RCTExportedDimensions(RCTPlatformView *rootView);
#endif // ]TODO(macOS GH#774)

@interface RCTDeviceInfo : NSObject <RCTBridgeModule>

@end
