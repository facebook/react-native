/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTDefines.h>
#import <React/RCTGenericDelegateSplitter.h>
#import <React/RCTMountingTransactionObserving.h>
#import <React/RCTScrollableProtocol.h>
#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

/*
 * UIView class for <ScrollView> component.
 *
 * By design, the class does not implement any logic that contradicts to the normal behavior of UIScrollView and does
 * not contain any special/custom support for things like floating headers, pull-to-refresh components,
 * keyboard-avoiding functionality and so on. All that complexity must be implemented inside those components in order
 * to keep the complexity of this component manageable.
 */
@interface RCTScrollViewComponentView : RCTViewComponentView <RCTMountingTransactionObserving>

/*
 * Finds and returns the closet RCTScrollViewComponentView component to the given view
 */
+ (nullable RCTScrollViewComponentView *)findScrollViewComponentViewForView:(RCTUIView *)view; // TODO(macOS GH#774)

/*
 * Returns an actual UIScrollView that this component uses under the hood.
 */
@property (nonatomic, strong, readonly) RCTUIScrollView *scrollView; // TODO(macOS GH#774)

/*
 * Returns the subview of the scroll view that the component uses to mount all subcomponents into. That's useful to
 * separate component views from auxiliary views to be able to reliably implement pull-to-refresh- and RTL-related
 * functionality.
 */
@property (nonatomic, strong, readonly) RCTUIView *containerView; // TODO(macOS GH#774)

/*
 * Returns a delegate splitter that can be used to subscribe for UIScrollView delegate.
 */
#if !TARGET_OS_OSX // TODO(macOS GH#774)
@property (nonatomic, strong, readonly)
    RCTGenericDelegateSplitter<id<UIScrollViewDelegate>> *scrollViewDelegateSplitter;
#endif // TODO(macOS GH#774)

@end

/*
 * RCTScrollableProtocol is a protocol which RCTScrollViewManager uses to communicate with all kinds of `UIScrollView`s.
 * Until Fabric has own command-execution pipeline we have to support that to some extent. The implementation shouldn't
 * be perfect though because very soon we will migrate that to the new commands infra and get rid of this.
 */
@interface RCTScrollViewComponentView (ScrollableProtocol) <RCTScrollableProtocol>

@end

NS_ASSUME_NONNULL_END
