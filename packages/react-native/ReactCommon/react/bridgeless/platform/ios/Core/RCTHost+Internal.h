/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTHost.h"

#import <ReactCommon/RCTContextContainerHandling.h>
#import <jsi/jsi.h>

typedef NSURL * (^RCTHostBundleURLProvider)(void);

@protocol RCTHostRuntimeDelegate <NSObject>

- (void)hostDidInitializeRuntime:(facebook::jsi::Runtime &)runtime;

@end

@interface RCTHost (Internal)

- (void)registerSegmentWithId:(NSNumber *)segmentId path:(NSString *)path;
- (void)setBundleURLProvider:(RCTHostBundleURLProvider)bundleURLProvider;
- (void)setRuntimeDelegate:(id<RCTHostRuntimeDelegate>)runtimeDelegate;
- (void)setContextContainerHandler:(id<RCTContextContainerHandling>)contextContainerHandler;

@end
