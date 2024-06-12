/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import <string>

struct CommonHostMetadata {
  std::string appIdentifier;
  std::string deviceName;
  std::string platform;
  std::string reactNativeVersion;
};

@interface RCTInspectorUtils : NSObject

+ (CommonHostMetadata)getHostMetadata;

@end
