/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <ReactCommon/RuntimeExecutor.h>
#import <jsi/jsi.h>

NS_ASSUME_NONNULL_BEGIN

typedef void (^RCTJSIRuntimeHandlingBlock)(facebook::jsi::Runtime &runtime);

@interface RCTRuntimeExecutor : NSObject

- (instancetype)init NS_UNAVAILABLE;

/**
 Initializes an object that wraps ways to access the RuntimeExecutor.

 @param runtimeExecutor The instance of RuntimeExecutor.
 */
- (instancetype)initWithRuntimeExecutor:(facebook::react::RuntimeExecutor)runtimeExecutor NS_DESIGNATED_INITIALIZER;

- (void)execute:(RCTJSIRuntimeHandlingBlock)block;

@end

NS_ASSUME_NONNULL_END
