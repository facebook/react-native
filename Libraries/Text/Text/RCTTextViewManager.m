/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTTextViewManager.h"

#import <React/RCTAccessibilityManager.h>
#import <React/RCTShadowView+Layout.h>
#import <React/RCTShadowView.h>
#import <React/RCTUIManager.h>
#import <React/RCTUIManagerObserverCoordinator.h>

#import "RCTTextShadowView.h"
#import "RCTTextView.h"

@interface RCTTextViewManager () <RCTUIManagerObserver>

@end

@implementation RCTTextViewManager
{
  NSHashTable<RCTTextShadowView *> *_shadowViews;
  CGFloat _fontSizeMultiplier;
}

RCT_EXPORT_MODULE(RCTText)

RCT_REMAP_SHADOW_PROPERTY(numberOfLines, maximumNumberOfLines, NSInteger)
RCT_REMAP_SHADOW_PROPERTY(ellipsizeMode, lineBreakMode, NSLineBreakMode)
RCT_REMAP_SHADOW_PROPERTY(adjustsFontSizeToFit, adjustsFontSizeToFit, BOOL)
RCT_REMAP_SHADOW_PROPERTY(minimumFontScale, minimumFontScale, CGFloat)

RCT_EXPORT_VIEW_PROPERTY(selectable, BOOL)

- (void)setBridge:(RCTBridge *)bridge
{
  [super setBridge:bridge];
  _shadowViews = [NSHashTable weakObjectsHashTable];

  [bridge.uiManager.observerCoordinator addObserver:self];

  [[NSNotificationCenter defaultCenter] addObserver:self
                                           selector:@selector(handleDidUpdateMultiplierNotification)
                                               name:RCTAccessibilityManagerDidUpdateMultiplierNotification
                                             object:bridge.accessibilityManager];
}

- (void)dealloc
{
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (UIView *)view
{
  return [RCTTextView new];
}

- (RCTShadowView *)shadowView
{
  RCTTextShadowView *shadowView = [[RCTTextShadowView alloc] initWithBridge:self.bridge];
  shadowView.textAttributes.fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;
  [_shadowViews addObject:shadowView];
  return shadowView;
}

#pragma mark - RCTUIManagerObserver

- (void)uiManagerWillPerformMounting:(__unused RCTUIManager *)uiManager
{
  for (RCTTextShadowView *shadowView in _shadowViews) {
    [shadowView uiManagerWillPerformMounting];
  }
}

#pragma mark - Font Size Multiplier

- (void)handleDidUpdateMultiplierNotification
{
  CGFloat fontSizeMultiplier = self.bridge.accessibilityManager.multiplier;

  for (RCTTextShadowView *shadowView in _shadowViews) {
    shadowView.textAttributes.fontSizeMultiplier = fontSizeMultiplier;
    [shadowView dirtyLayout];
  }

  [self.bridge.uiManager setNeedsLayout];
}

@end
