/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>
#import <react/runtime/JSRuntimeFactoryCAPI.h>

#pragma once

NS_ASSUME_NONNULL_BEGIN

@protocol RCTJSRuntimeConfiguratorProtocol

- (JSRuntimeFactoryRef)createJSRuntimeFactory;

@end

NS_ASSUME_NONNULL_END
