/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <react/renderer/textlayoutmanager/RCTFontProperties.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Returns UIFont instance corresponded to given font properties.
 */
UIFont* RCTFontWithFontProperties(RCTFontProperties fontProperties);

NS_ASSUME_NONNULL_END
