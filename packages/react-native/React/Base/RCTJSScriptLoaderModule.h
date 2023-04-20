/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

@class RCTSource;

NS_ASSUME_NONNULL_BEGIN

/**
 * This protocol should be adopted when a turbo module needs to tell React Native to load a script.
 * In bridge-less React Native, it is a replacement for [_bridge loadAndExecuteSplitBundleURL:].
 */
@protocol RCTJSScriptLoaderModule <NSObject>

@property (nonatomic, copy) void (^loadScript)(RCTSource *source);

@end

NS_ASSUME_NONNULL_END
