/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTModalHostViewManager.h"

#import <UIKit/UIKit.h>

#import "RCTBridge.h"
#import "RCTModalHostView.h"
#import "RCTModalHostViewController.h"
#import "RCTModalManager.h"
#import "RCTShadowView.h"
#import "RCTUtils.h"

@implementation RCTConvert (RCTModalHostView)

RCT_ENUM_CONVERTER(UIModalPresentationStyle, (@{
  @"fullScreen": @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
  @"pageSheet": @(UIModalPresentationPageSheet),
  @"formSheet": @(UIModalPresentationFormSheet),
#endif
  @"overFullScreen": @(UIModalPresentationOverFullScreen),
}), UIModalPresentationFullScreen, integerValue)

@end

@interface RCTModalHostShadowView : RCTShadowView

@end

@implementation RCTModalHostShadowView

- (void)insertReactSubview:(id<RCTComponent>)subview atIndex:(NSInteger)atIndex
{
  [super insertReactSubview:subview atIndex:atIndex];
  if ([subview isKindOfClass:[RCTShadowView class]]) {
    ((RCTShadowView *)subview).size = RCTScreenSize();
  }
}

@end

@interface RCTModalHostViewManager () <RCTModalHostViewInteractor>

@end

#if !TARGET_OS_TV
static UIInterfaceOrientationMask _appSupportedOrientationMask;
#endif

@implementation RCTModalHostViewManager
{
  NSHashTable *_hostViews;
}

#if !TARGET_OS_TV
- (UIInterfaceOrientationMask)appSupportedOrientationMask
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    NSArray *orientations = [NSBundle mainBundle].infoDictionary[@"UISupportedInterfaceOrientations"];
    UIInterfaceOrientationMask mask = 0;
    for (NSString *orientation in orientations) {
      if ([orientation isEqualToString:@"UIInterfaceOrientationPortrait"]) {
        mask |= 1 << UIInterfaceOrientationPortrait;
      } else if ([orientation isEqualToString:@"UIInterfaceOrientationPortraitUpsideDown"]) {
        mask |= 1 << UIInterfaceOrientationPortraitUpsideDown;
      } else if ([orientation isEqualToString:@"UIInterfaceOrientationLandscapeLeft"]) {
        mask |= 1 << UIInterfaceOrientationLandscapeLeft;
      } else if ([orientation isEqualToString:@"UIInterfaceOrientationLandscapeRight"]) {
        mask |= 1 << UIInterfaceOrientationLandscapeRight;
      }
    }
    _appSupportedOrientationMask = mask;
  });
  return _appSupportedOrientationMask;
}
#endif

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTModalHostView *view = [[RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
#if !TARGET_OS_TV
  view.appSupportedOrientationMask = [self appSupportedOrientationMask];
#endif
  if (!_hostViews) {
    _hostViews = [NSHashTable weakObjectsHashTable];
  }
  [_hostViews addObject:view];
  return view;
}

- (void)presentModalHostView:(RCTModalHostView *)modalHostView withViewController:(RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView reactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView reactViewController] presentViewController:viewController animated:animated completion:completionBlock];
  }
}

- (void)dismissModalHostView:(RCTModalHostView *)modalHostView withViewController:(RCTModalHostViewController *)viewController animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
  };
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView reactViewController], viewController, animated, completionBlock);
  } else {
    [viewController dismissViewControllerAnimated:animated completion:completionBlock];
  }
}


- (RCTShadowView *)shadowView
{
  return [RCTModalHostShadowView new];
}

- (void)invalidate
{
  for (RCTModalHostView *hostView in _hostViews) {
    [hostView invalidate];
  }
  [_hostViews removeAllObjects];
}

RCT_EXPORT_VIEW_PROPERTY(animationType, NSString)
RCT_EXPORT_VIEW_PROPERTY(presentationStyle, UIModalPresentationStyle)
RCT_EXPORT_VIEW_PROPERTY(transparent, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onShow, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, RCTDirectEventBlock)

#if TARGET_OS_TV
RCT_EXPORT_VIEW_PROPERTY(onRequestClose, RCTDirectEventBlock)
#endif

@end
