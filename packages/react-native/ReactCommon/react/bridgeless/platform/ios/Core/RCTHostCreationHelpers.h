/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>

#import "RCTHost.h"

@class RCTHost;

@protocol RCTHostDelegate;
@protocol RCTTurboModuleManagerDelegate;

NS_ASSUME_NONNULL_BEGIN

RCT_EXTERN_C_BEGIN

RCTHost *RCTHostCreateDefault(
    NSURL *bundleURL,
    id<RCTHostDelegate> hostDelegate,
    id<RCTTurboModuleManagerDelegate> turboModuleManagerDelegate,
    RCTHostJSEngineProvider jsEngineProvider);

RCT_EXTERN_C_END

NS_ASSUME_NONNULL_END
