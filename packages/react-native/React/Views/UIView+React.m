/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "UIView+React.h"

#import <objc/runtime.h>

#import "RCTAssert.h"
#import "RCTLog.h"
#import "RCTShadowView.h"

@implementation RCTPlatformView (React) // [macOS]

- (NSNumber *)reactTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setReactTag:(NSNumber *)reactTag
{
  objc_setAssociatedObject(self, @selector(reactTag), reactTag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSNumber *)rootTag
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setRootTag:(NSNumber *)rootTag
{
  objc_setAssociatedObject(self, @selector(rootTag), rootTag, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSString *)nativeID
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setNativeID:(NSString *)nativeID
{
  objc_setAssociatedObject(self, @selector(nativeID), nativeID, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (BOOL)shouldAccessibilityIgnoresInvertColors
{
#if !TARGET_OS_OSX // [macOS]
  return self.accessibilityIgnoresInvertColors;
#else // [macOS
  return NO;
#endif // macOS]
}

- (void)setShouldAccessibilityIgnoresInvertColors:(BOOL)shouldAccessibilityIgnoresInvertColors
{
#if !TARGET_OS_OSX // [macOS]
  self.accessibilityIgnoresInvertColors = shouldAccessibilityIgnoresInvertColors;
#endif // [macOS]
}

- (BOOL)isReactRootView
{
  return RCTIsReactRootView(self.reactTag);
}

- (NSNumber *)reactTagAtPoint:(CGPoint)point
{
  RCTPlatformView *view = RCTUIViewHitTestWithEvent(self, point, nil); // [macOS]
  while (view && !view.reactTag) {
    view = view.superview;
  }
  return view.reactTag;
}

- (NSArray<RCTPlatformView *> *)reactSubviews // [macOS]
{
  return objc_getAssociatedObject(self, _cmd);
}

- (RCTPlatformView *)reactSuperview // [macOS]
{
  return self.superview;
}

- (void)insertReactSubview:(RCTPlatformView *)subview atIndex:(NSInteger)atIndex // [macOS]
{
  // We access the associated object directly here in case someone overrides
  // the `reactSubviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(reactSubviews));
  if (!subviews) {
    subviews = [NSMutableArray new];
    objc_setAssociatedObject(self, @selector(reactSubviews), subviews, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
  [subviews insertObject:subview atIndex:atIndex];
}

- (void)removeReactSubview:(RCTPlatformView *)subview // [macOS]
{
  // We access the associated object directly here in case someone overrides
  // the `reactSubviews` getter method and returns an immutable array.
  NSMutableArray *subviews = objc_getAssociatedObject(self, @selector(reactSubviews));
  [subviews removeObject:subview];
  [subview removeFromSuperview];
}

#pragma mark - Display

- (YGDisplay)reactDisplay
{
  return self.isHidden ? YGDisplayNone : YGDisplayFlex;
}

- (void)setReactDisplay:(YGDisplay)display
{
  self.hidden = display == YGDisplayNone;
}

#pragma mark - Layout Direction

- (UIUserInterfaceLayoutDirection)reactLayoutDirection
{
#if !TARGET_OS_OSX // [macOS]
  if ([self respondsToSelector:@selector(semanticContentAttribute)]) {
#pragma clang diagnostic push // [macOS]
#pragma clang diagnostic ignored "-Wunguarded-availability" // [macOS]
    return [UIView userInterfaceLayoutDirectionForSemanticContentAttribute:self.semanticContentAttribute];
#pragma clang diagnostic pop // [macOS]
  } else {
    return [objc_getAssociatedObject(self, @selector(reactLayoutDirection)) integerValue];
  }
#else // [macOS
	return self.userInterfaceLayoutDirection;
#endif // macOS]
}

- (void)setReactLayoutDirection:(UIUserInterfaceLayoutDirection)layoutDirection
{
#if !TARGET_OS_OSX // [macOS]
  if ([self respondsToSelector:@selector(setSemanticContentAttribute:)]) {
#pragma clang diagnostic push // [macOS]
#pragma clang diagnostic ignored "-Wunguarded-availability" // [macOS]
    self.semanticContentAttribute = layoutDirection == UIUserInterfaceLayoutDirectionLeftToRight
        ? UISemanticContentAttributeForceLeftToRight
        : UISemanticContentAttributeForceRightToLeft;
#pragma clang diagnostic pop // [macOS]
  } else {
    objc_setAssociatedObject(
        self, @selector(reactLayoutDirection), @(layoutDirection), OBJC_ASSOCIATION_RETAIN_NONATOMIC);
  }
#else // [macOS
	self.userInterfaceLayoutDirection	= layoutDirection;
#endif // macOS]
}

#pragma mark - zIndex

- (NSInteger)reactZIndex
{
  return self.layer.zPosition;
}

- (void)setReactZIndex:(NSInteger)reactZIndex
{
  self.layer.zPosition = reactZIndex;
}

- (NSArray<RCTPlatformView *> *)reactZIndexSortedSubviews // [macOS]
{
  // Check if sorting is required - in most cases it won't be.
  BOOL sortingRequired = NO;
  for (RCTUIView *subview in self.subviews) { // [macOS]
    if (subview.reactZIndex != 0) {
      sortingRequired = YES;
      break;
    }
  }
  return sortingRequired ? [self.reactSubviews sortedArrayUsingComparator:^NSComparisonResult(RCTUIView *a, RCTUIView *b) { // [macOS]
    if (a.reactZIndex > b.reactZIndex) {
      return NSOrderedDescending;
    } else {
      // Ensure sorting is stable by treating equal zIndex as ascending so
      // that original order is preserved.
      return NSOrderedAscending;
    }
  }]
                         : self.subviews;
}

- (void)didUpdateReactSubviews
{
  for (RCTPlatformView *subview in self.reactSubviews) { // [macOS]
    [self addSubview:subview];
  }
}

- (void)didSetProps:(__unused NSArray<NSString *> *)changedProps
{
  // The default implementation does nothing.
}

- (void)reactSetFrame:(CGRect)frame
{
#if !TARGET_OS_OSX // [macOS]
  // These frames are in terms of anchorPoint = topLeft, but internally the
  // views are anchorPoint = center for easier scale and rotation animations.
  // Convert the frame so it works with anchorPoint = center.
  CGPoint position = {CGRectGetMidX(frame), CGRectGetMidY(frame)};
  CGRect bounds = {CGPointZero, frame.size};

  // Avoid crashes due to nan coords
  if (isnan(position.x) || isnan(position.y) || isnan(bounds.origin.x) || isnan(bounds.origin.y) ||
      isnan(bounds.size.width) || isnan(bounds.size.height)) {
    RCTLogError(
        @"Invalid layout for (%@)%@. position: %@. bounds: %@",
        self.reactTag,
        self,
        NSStringFromCGPoint(position),
        NSStringFromCGRect(bounds));
    return;
  }

  self.center = position;
  self.bounds = bounds;
#else // [macOS
  // Avoid crashes due to nan coords
  if (isnan(frame.origin.x) || isnan(frame.origin.y) ||
      isnan(frame.size.width) || isnan(frame.size.height)) {
    RCTLogError(@"Invalid layout for (%@)%@. frame: %@",
                self.reactTag, self, NSStringFromCGRect(frame));
    return;
  }

	self.frame = frame;
#endif // macOS]
}

- (UIViewController *)reactViewController
{
  id responder = [self nextResponder];
  while (responder) {
    if ([responder isKindOfClass:[UIViewController class]]) {
      return responder;
    }
    responder = [responder nextResponder];
  }
  return nil;
}

#if !TARGET_OS_OSX // [macOS]
- (void)reactAddControllerToClosestParent:(UIViewController *)controller
{
  if (!controller.parentViewController) {
    UIView *parentView = (UIView *)self.reactSuperview;
    while (parentView) {
      if (parentView.reactViewController) {
        [parentView.reactViewController addChildViewController:controller];
        [controller didMoveToParentViewController:parentView.reactViewController];
        break;
      }
      parentView = (UIView *)parentView.reactSuperview;
    }
    return;
  }
}
#endif // [macOS]

// [macOS Github#1412
- (void)reactViewDidMoveToWindow
{
	[self reactFocusIfNeeded];
}
// macOS]

/**
 * Focus manipulation.
 */
static __weak RCTPlatformView *_pendingFocusView; // [macOS]

- (void)reactFocus
{
#if !TARGET_OS_OSX // [macOS]
	if (![self becomeFirstResponder]) {
#else // [macOS
	if (![[self window] makeFirstResponder:self]) {
#endif // macOS]
// [macOS Github#1412
    _pendingFocusView = self;
  } else {
    _pendingFocusView = nil;
  }
// macOS]
}

- (void)reactFocusIfNeeded
{
	if ([self isEqual:_pendingFocusView]) { // [macOS]
#if TARGET_OS_OSX // [macOS
		if ([[self window] makeFirstResponder:self]) {
#else
		if ([self becomeFirstResponder]) {
#endif // macOS]
			_pendingFocusView = nil; // [macOS] Github#1412
		}
	}
}

- (void)reactBlur
{
#if !TARGET_OS_OSX // [macOS]
  [self resignFirstResponder];
#else // [macOS
  if (self == [[self window] firstResponder]) {
    [[self window] makeFirstResponder:[[self window] nextResponder]];
  }
#endif // macOS]

// [macOS Github#1412
  if ([self isEqual:_pendingFocusView]) {
    _pendingFocusView = nil;
  }
// macOS]
}

#pragma mark - Layout

- (UIEdgeInsets)reactBorderInsets
{
  CGFloat borderWidth = self.layer.borderWidth;
  return UIEdgeInsetsMake(borderWidth, borderWidth, borderWidth, borderWidth);
}

- (UIEdgeInsets)reactPaddingInsets
{
  return UIEdgeInsetsZero;
}

- (UIEdgeInsets)reactCompoundInsets
{
  UIEdgeInsets borderInsets = self.reactBorderInsets;
  UIEdgeInsets paddingInsets = self.reactPaddingInsets;

  return UIEdgeInsetsMake(
      borderInsets.top + paddingInsets.top,
      borderInsets.left + paddingInsets.left,
      borderInsets.bottom + paddingInsets.bottom,
      borderInsets.right + paddingInsets.right);
}

- (CGRect)reactContentFrame
{
  return UIEdgeInsetsInsetRect(self.bounds, self.reactCompoundInsets);
}

#pragma mark - Accessibility

- (RCTPlatformView *)reactAccessibilityElement // [macOS]
{
  return self;
}

- (NSArray<NSDictionary *> *)accessibilityActions
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityActions:(NSArray<NSDictionary *> *)accessibilityActions
{
  objc_setAssociatedObject(
      self, @selector(accessibilityActions), accessibilityActions, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSString *)accessibilityLanguage
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityLanguage:(NSString *)accessibilityLanguage
{
  objc_setAssociatedObject(
      self, @selector(accessibilityLanguage), accessibilityLanguage, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSString *)accessibilityRoleInternal // [macOS] renamed so it doesn't conflict with -[NSAccessibility accessibilityRole].
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityRoleInternal:(NSString *)accessibilityRole // [macOS] renamed so it doesn't conflict with -[NSAccessibility setAccessibilityRole].
{
  objc_setAssociatedObject(self, @selector(accessibilityRoleInternal), accessibilityRole, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSDictionary<NSString *, id> *)accessibilityState
{
  return objc_getAssociatedObject(self, _cmd);
}

- (void)setAccessibilityState:(NSDictionary<NSString *, id> *)accessibilityState
{
  objc_setAssociatedObject(self, @selector(accessibilityState), accessibilityState, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

- (NSDictionary<NSString *, id> *)accessibilityValueInternal
{
  return objc_getAssociatedObject(self, _cmd);
}
- (void)setAccessibilityValueInternal:(NSDictionary<NSString *, id> *)accessibilityValue
{
  objc_setAssociatedObject(
      self, @selector(accessibilityValueInternal), accessibilityValue, OBJC_ASSOCIATION_RETAIN_NONATOMIC);
}

// [macOS
#pragma mark - Hit testing
#if TARGET_OS_OSX  
- (RCTPlatformView *)hitTest:(CGPoint)point withEvent:(UIEvent *)event
{
  return [self hitTest:point];
}
#endif // macOS]

#pragma mark - Debug
- (void)react_addRecursiveDescriptionToString:(NSMutableString *)string atLevel:(NSUInteger)level
{
  for (NSUInteger i = 0; i < level; i++) {
    [string appendString:@"   | "];
  }

  [string appendString:self.description];
  [string appendString:@"\n"];

  for (RCTPlatformView *subview in self.subviews) { // [macOS]
    [subview react_addRecursiveDescriptionToString:string atLevel:level + 1];
  }
}

- (NSString *)react_recursiveDescription
{
  NSMutableString *description = [NSMutableString string];
  [self react_addRecursiveDescriptionToString:description atLevel:0];
  return description;
}

@end
