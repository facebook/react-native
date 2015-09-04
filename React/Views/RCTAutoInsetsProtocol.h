/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

/**
 * Defines a View that wants to support auto insets adjustment
 */
@protocol RCTAutoInsetsProtocol

@property (nonatomic, assign, readwrite) UIEdgeInsets contentInset;
@property (nonatomic, assign, readwrite) BOOL automaticallyAdjustContentInsets;

/**
 * Automatically adjusted content inset depends on view controller's top and bottom
 * layout guides so if you've changed one of them (e.g. after rotation or manually) you should call this method
 * to recalculate and refresh content inset.
 * To handle case with changing navigation bar height call this method from viewDidLayoutSubviews:
 * of your view controller.
 */
- (void)refreshContentInset;

@end
