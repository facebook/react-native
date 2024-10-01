/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTJavaScriptLoader.h>

#import "RCTHost.h"

NS_ASSUME_NONNULL_BEGIN

@protocol RCTCustomBundlerProvider <NSObject>

@optional

/**
 * The `RCTInstance` will automatically attempt to load the JS source code , however, if you want
 * to handle loading the JS yourself, you can do so by implementing this method.
 */
- (void)loadSourceForHost:(RCTHost *)host
               onProgress:(RCTSourceLoadProgressBlock)onProgress
               onComplete:(RCTSourceLoadBlock)loadCallback;

/**
 * Similar to loadSourceForHost:onProgress:onComplete: but without progress
 * reporting.
 */
- (void)loadSourceForHost:(RCTHost *)host withBlock:(RCTSourceLoadBlock)loadCallback;

@end

NS_ASSUME_NONNULL_END
