/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewAccessibilityElement.h"

@implementation RCTViewAccessibilityElement

- (instancetype)initWithView:(RCTViewComponentView *)view
{
  if (self = [super initWithAccessibilityContainer:view]) {
    _view = view;
  }

  return self;
}

- (CGRect)accessibilityFrame
{
  return UIAccessibilityConvertFrameToScreenCoordinates(_view.bounds, _view);
}

#pragma mark - Forwarding to _view

- (NSString *)accessibilityLabel
{
  return _view.accessibilityLabel;
}

- (NSString *)accessibilityValue
{
  return _view.accessibilityValue;
}

- (UIAccessibilityTraits)accessibilityTraits
{
  return _view.accessibilityTraits;
}

- (NSString *)accessibilityHint
{
  return _view.accessibilityHint;
}

- (BOOL)accessibilityIgnoresInvertColors
{
  return _view.accessibilityIgnoresInvertColors;
}

- (BOOL)shouldGroupAccessibilityChildren
{
  return _view.shouldGroupAccessibilityChildren;
}

- (NSArray<UIAccessibilityCustomAction *> *)accessibilityCustomActions
{
  return _view.accessibilityCustomActions;
}

- (NSString *)accessibilityLanguage
{
  return _view.accessibilityLanguage;
}

- (BOOL)accessibilityViewIsModal
{
  return _view.accessibilityViewIsModal;
}

- (BOOL)accessibilityElementsHidden
{
  return _view.accessibilityElementsHidden;
}

- (BOOL)accessibilityRespondsToUserInteraction
{
  return _view.accessibilityRespondsToUserInteraction;
}

@end
