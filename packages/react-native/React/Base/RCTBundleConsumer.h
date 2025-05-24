/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTJavaScriptLoader.h>

@protocol RCTBundleConsumer <NSObject>

/**
 * A reference to the RCTModuleRegistry. Useful for modules that require access
 * to other NativeModules. To implement this in your module, just add `@synthesize
 * moduleRegistry = _moduleRegistry;`. If using Swift, add
 * `@objc var moduleRegistry: RCTModuleRegistry!` to your module.
 */
@property (nonatomic, weak, readwrite) RCTSource *source;

@end
