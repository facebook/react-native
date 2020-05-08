/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTGenericDelegateSplitter.h>
#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * `UIScrollView` subclass which has some improvements and tweaks
 * which are not directly related to React Native.
 */
@interface RCTEnhancedScrollView : UIScrollView

/*
 * Returns a delegate splitter that can be used to create as many `UIScrollView` delegates as needed.
 * Use that instead of accessing `delegate` property directly.
 *
 * This class overrides the `delegate` property and wires that to the delegate splitter.
 *
 * We never know which another part of the app might introspect the view hierarchy and mess with `UIScrollView`'s
 * delegate, so we expose a fake delegate connected to the original one via the splitter to make the component as
 * resilient to other code as possible: even if something else nil the delegate, other delegates that were subscribed
 * via the splitter will continue working.
 */
@property (nonatomic, strong, readonly) RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *delegateSplitter;

@property (nonatomic, assign) BOOL pinchGestureEnabled;
@property (nonatomic, assign) BOOL centerContent;

@end

NS_ASSUME_NONNULL_END
