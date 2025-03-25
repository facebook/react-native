/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include(<JSITooling/react/runtime/JSRuntimeFactoryCAPI.h>)
// In a use_frameworks build and when any Objective-C files import the `React_RCTAppDelegate` framework,
// Xcode will display an "include of non-modular header inside framework module" error.
// The root cause is that the JSITooling CocoaPods-generated umbrella header does not correctly support submodules.
// This workaround imports the header from outside the module.
#import <JSITooling/react/runtime/JSRuntimeFactoryCAPI.h>
#else
#import <react/runtime/JSRuntimeFactoryCAPI.h>
#endif

NS_ASSUME_NONNULL_BEGIN

@protocol RCTJSRuntimeConfiguratorProtocol

- (JSRuntimeFactoryRef)createJSRuntimeFactory;

@end

NS_ASSUME_NONNULL_END
