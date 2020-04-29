/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTRootView.h>

@class RCTTVRemoteHandler;

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

/**
 * TV remote gesture recognizers
 */
#if TARGET_OS_TV
@property (nonatomic, strong) RCTTVRemoteHandler *tvRemoteHandler;
@property (nonatomic, strong) UIView *reactPreferredFocusedView;
#endif

- (void)contentViewInvalidated;

@end
