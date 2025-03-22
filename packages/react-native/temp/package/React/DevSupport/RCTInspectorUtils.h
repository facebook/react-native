/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

// This is a subset of jsinspector_modern::HostTargetMetadata with ObjC types,
// containing the members implemented by getHostMetadata.
@interface CommonHostMetadata : NSObject

@property (nonatomic, strong) NSString *appDisplayName;
@property (nonatomic, strong) NSString *appIdentifier;
@property (nonatomic, strong) NSString *deviceName;
@property (nonatomic, strong) NSString *platform;
@property (nonatomic, strong) NSString *reactNativeVersion;

@end

@interface RCTInspectorUtils : NSObject

+ (CommonHostMetadata *)getHostMetadata;

@end
