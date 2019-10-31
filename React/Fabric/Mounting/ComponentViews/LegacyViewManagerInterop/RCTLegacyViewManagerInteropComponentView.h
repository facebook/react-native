/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTLegacyViewManagerInteropComponentView : RCTViewComponentView

/**
 Returns true for components that are supported by LegacyViewManagerInterop layer, false otherwise.
 */
+ (BOOL)isSupported:(NSString *)componentName;

+ (void)supportLegacyViewManagerWithName:(NSString *)componentName;

@end

NS_ASSUME_NONNULL_END
