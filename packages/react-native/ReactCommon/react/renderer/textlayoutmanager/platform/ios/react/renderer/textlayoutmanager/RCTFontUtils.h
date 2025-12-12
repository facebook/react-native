/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTDefines.h>
#import <UIKit/UIKit.h>
#import <react/renderer/textlayoutmanager/RCTFontProperties.h>

NS_ASSUME_NONNULL_BEGIN

using RCTDefaultFontResolver = UIFont *__nullable (^)(const RCTFontProperties &);

/**
 * React Native will use the System font for rendering by default. If you want to
 * provide a different base font, use this override.
 */
RCT_EXTERN void RCTSetDefaultFontResolver(RCTDefaultFontResolver handler);

/**
 * Returns UIFont instance corresponded to given font properties.
 */
RCT_EXTERN UIFont *RCTFontWithFontProperties(RCTFontProperties fontProperties);

NS_ASSUME_NONNULL_END
