/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

#import <React/RCTComponent.h>
#import <yoga/YGEnums.h>

@class RCTShadowView;

@interface RCTPlatformView (React) <RCTComponent> // [macOS]

/**
 * RCTComponent interface.
 */
- (NSArray<RCTPlatformView *> *)reactSubviews NS_REQUIRES_SUPER; // [macOS]
- (RCTPlatformView *)reactSuperview NS_REQUIRES_SUPER; // [macOS]
- (void)insertReactSubview:(RCTPlatformView *)subview atIndex:(NSInteger)atIndex NS_REQUIRES_SUPER; // [macOS]
- (void)removeReactSubview:(RCTPlatformView *)subview NS_REQUIRES_SUPER; // [macOS]

/**
 * The native id of the view, used to locate view from native codes
 */
@property (nonatomic, copy) NSString *nativeID;

/**
 * Determines whether or not a view should ignore inverted colors or not. Used to set
 * UIView property accessibilityIgnoresInvertColors in iOS 11+.
 */
@property (nonatomic, assign) BOOL shouldAccessibilityIgnoresInvertColors;

/**
 * Layout direction of the view.
 * Internally backed to `semanticContentAttribute` property.
 * Defaults to `LeftToRight` in case of ambiguity.
 */
@property (nonatomic, assign) UIUserInterfaceLayoutDirection reactLayoutDirection;

/**
 * Yoga `display` style property. Can be `flex` or `none`.
 * Defaults to `flex`.
 * May be used to temporary hide the view in a very efficient way.
 */
@property (nonatomic, assign) YGDisplay reactDisplay;

/**
 * The z-index of the view.
 */
@property (nonatomic, assign) NSInteger reactZIndex;

/**
 * Subviews sorted by z-index. Note that this method doesn't do any caching (yet)
 * and sorts all the views each call.
 */
- (NSArray<RCTPlatformView *> *)reactZIndexSortedSubviews; // [macOS]

/**
 * Updates the subviews array based on the reactSubviews. Default behavior is
 * to insert the sortedReactSubviews into the UIView.
 */
- (void)didUpdateReactSubviews;

/**
 * Called each time props have been set.
 * The default implementation does nothing.
 */
- (void)didSetProps:(NSArray<NSString *> *)changedProps;

/**
 * Used by the UIIManager to set the view frame.
 * May be overridden to disable animation, etc.
 */
- (void)reactSetFrame:(CGRect)frame;

/**
 * This method finds and returns the containing view controller for the view.
 */
- (UIViewController *)reactViewController;

#if !TARGET_OS_OSX // [macOS]
/**
 * This method attaches the specified controller as a child of the
 * the owning view controller of this view. Returns NO if no view
 * controller is found (which may happen if the view is not currently
 * attached to the view hierarchy).
 */
- (void)reactAddControllerToClosestParent:(UIViewController *)controller;
#endif // [macOS]

- (void)reactViewDidMoveToWindow; // [macOS] Github #1412

/**
 * Focus manipulation.
 */
- (void)reactFocus;
- (void)reactFocusIfNeeded;
- (void)reactBlur;

/**
 * Useful properties for computing layout.
 */
@property (nonatomic, readonly) UIEdgeInsets reactBorderInsets;
@property (nonatomic, readonly) UIEdgeInsets reactPaddingInsets;
@property (nonatomic, readonly) UIEdgeInsets reactCompoundInsets;
@property (nonatomic, readonly) CGRect reactContentFrame;

/**
 * The (sub)view which represents this view in terms of accessibility.
 * ViewManager will apply all accessibility properties directly to this view.
 * May be overridden in view subclass which needs to be accessiblitywise
 * transparent in favour of some subview.
 * Defaults to `self`.
 */
@property (nonatomic, readonly) RCTPlatformView *reactAccessibilityElement; // [macOS]

/**
 * Accessibility properties
 */
@property (nonatomic, copy) NSString *accessibilityRoleInternal; // [macOS] renamed so it doesn't conflict with -[NSAccessibility accessibilityRole].
@property (nonatomic, copy) NSDictionary<NSString *, id> *accessibilityState;
@property (nonatomic, copy) NSArray<NSDictionary *> *accessibilityActions;
@property (nonatomic, copy) NSDictionary *accessibilityValueInternal;
@property (nonatomic, copy) NSString *accessibilityLanguage;

/**
 * Used in debugging to get a description of the view hierarchy rooted at
 * the current view.
 */
- (NSString *)react_recursiveDescription;

@end
