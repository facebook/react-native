/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTRootView.h>

#ifndef RCT_FIT_RM_OLD_RUNTIME

/**
 * The interface provides a set of functions that allow other internal framework
 * classes to change the RCTRootViews's internal state.
 */
@interface RCTRootView ()

/**
 * This setter should be used only by RCTUIManager on react root view
 * intrinsic content size update.
 */
@property (readwrite, nonatomic, assign) CGSize intrinsicContentSize;

- (void)contentViewInvalidated;

@end

#endif // RCT_FIT_RM_OLD_RUNTIME
