/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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
