/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

#import <React/RCTBorderStyle.h>
#import <React/RCTComponent.h>
#import <React/RCTEventDispatcherProtocol.h> // TODO(OSS Candidate ISS#2710739)
#import <React/RCTPointerEvents.h>

#if !TARGET_OS_OSX // TODO(macOS GH#774)
extern const UIAccessibilityTraits SwitchAccessibilityTrait;
#endif // TODO(macOS GH#774)

@protocol RCTAutoInsetsProtocol;

@interface RCTView : RCTUIView // TODO(macOS ISS#3536887)

// [TODO(OSS Candidate ISS#2710739)
- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher;

- (BOOL)becomeFirstResponder;
- (BOOL)resignFirstResponder;

#if TARGET_OS_OSX
- (BOOL)handleKeyboardEvent:(NSEvent *)event;
#endif
// ]TODO(OSS Candidate ISS#2710739)

/**
 * Accessibility event handlers
 */
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityAction;
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityTap;
#if !TARGET_OS_OSX // TODO(macOS GH#774)
@property (nonatomic, copy) RCTDirectEventBlock onMagicTap;
#endif // TODO(macOS GH#774)
@property (nonatomic, copy) RCTDirectEventBlock onAccessibilityEscape;

/**
 * Used to control how touch events are processed.
 */
@property (nonatomic, assign) RCTPointerEvents pointerEvents;

+ (void)autoAdjustInsetsForView:(RCTUIView<RCTAutoInsetsProtocol> *)parentView // TODO(macOS ISS#3536887)
                 withScrollView:(RCTUIScrollView *)scrollView // TODO(macOS ISS#3536887) and TODO(macOS ISS#3536887)
                   updateOffset:(BOOL)updateOffset;

/**
 * Layout direction of the view.
 * This is inherited from UIView+React, but we override it here
 * to improve performance and make subclassing/overriding possible/easier.
 */
@property (nonatomic, assign) UIUserInterfaceLayoutDirection reactLayoutDirection;

/**
 * This is an optimization used to improve performance
 * for large scrolling views with many subviews, such as a
 * list or table. If set to YES, any clipped subviews will
 * be removed from the view hierarchy whenever -updateClippedSubviews
 * is called. This would typically be triggered by a scroll event
 */
@property (nonatomic, assign) BOOL removeClippedSubviews;

/**
 * Hide subviews if they are outside the view bounds.
 * This is an optimisation used predominantly with RKScrollViews
 * but it is applied recursively to all subviews that have
 * removeClippedSubviews set to YES
 */
- (void)updateClippedSubviews;

/**
 * Border radii.
 */
@property (nonatomic, assign) CGFloat borderRadius;
@property (nonatomic, assign) CGFloat borderTopLeftRadius;
@property (nonatomic, assign) CGFloat borderTopRightRadius;
@property (nonatomic, assign) CGFloat borderTopStartRadius;
@property (nonatomic, assign) CGFloat borderTopEndRadius;
@property (nonatomic, assign) CGFloat borderBottomLeftRadius;
@property (nonatomic, assign) CGFloat borderBottomRightRadius;
@property (nonatomic, assign) CGFloat borderBottomStartRadius;
@property (nonatomic, assign) CGFloat borderBottomEndRadius;

/**
 * Border colors (actually retained).
 */
@property (nonatomic, strong) RCTUIColor *borderTopColor;
@property (nonatomic, strong) RCTUIColor *borderRightColor;
@property (nonatomic, strong) RCTUIColor *borderBottomColor;
@property (nonatomic, strong) RCTUIColor *borderLeftColor;
@property (nonatomic, strong) RCTUIColor *borderStartColor;
@property (nonatomic, strong) RCTUIColor *borderEndColor;
@property (nonatomic, strong) RCTUIColor *borderColor;

/**
 * Border widths.
 */
@property (nonatomic, assign) CGFloat borderTopWidth;
@property (nonatomic, assign) CGFloat borderRightWidth;
@property (nonatomic, assign) CGFloat borderBottomWidth;
@property (nonatomic, assign) CGFloat borderLeftWidth;
@property (nonatomic, assign) CGFloat borderStartWidth;
@property (nonatomic, assign) CGFloat borderEndWidth;
@property (nonatomic, assign) CGFloat borderWidth;

/**
 * Border styles.
 */
@property (nonatomic, assign) RCTBorderStyle borderStyle;

/**
 *  Insets used when hit testing inside this view.
 */
@property (nonatomic, assign) UIEdgeInsets hitTestEdgeInsets;

#if TARGET_OS_OSX // [TODO(macOS GH#774)
/**
 * macOS Properties
 */

@property (nonatomic, assign) CATransform3D transform3D;

@property (nonatomic, copy) RCTDirectEventBlock onDoubleClick;
@property (nonatomic, copy) RCTDirectEventBlock onClick;
@property (nonatomic, copy) RCTDirectEventBlock onMouseEnter;
@property (nonatomic, copy) RCTDirectEventBlock onMouseLeave;
@property (nonatomic, copy) RCTDirectEventBlock onDragEnter;
@property (nonatomic, copy) RCTDirectEventBlock onDragLeave;
@property (nonatomic, copy) RCTDirectEventBlock onDrop;

// Keyboarding events
@property (nonatomic, copy) RCTDirectEventBlock onKeyDown;
@property (nonatomic, copy) RCTDirectEventBlock onKeyUp;
@property (nonatomic, copy) NSArray<NSString*> *validKeysDown;
@property (nonatomic, copy) NSArray<NSString*> *validKeysUp;
#endif // ]TODO(macOS GH#774)

/**
 * Common Focus Properties
 */
@property (nonatomic, copy) RCTBubblingEventBlock onFocus;
@property (nonatomic, copy) RCTBubblingEventBlock onBlur;

@end
