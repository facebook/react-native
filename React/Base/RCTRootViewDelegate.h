/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class RCTRootView;

@protocol RCTRootViewDelegate <NSObject>
/**
 * Called after the root view's content is updated to a new size. The method is not called
 * when both old size and new size have a dimension that equals to zero.
 *
 * The delegate can use this callback to appropriately resize the root view frame to fit the new
 * content view size. The view will not resize itself. The new content size is available via the
 * intrinsicSize propery of the root view.
 */
- (void)rootViewDidChangeIntrinsicSize:(RCTRootView *)rootView;

@end
