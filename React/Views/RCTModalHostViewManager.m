/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostViewManager.h"

#import "RCTBridge.h"
#import "RCTModalHostView.h"
#import "RCTModalHostViewController.h"
#import "RCTShadowView.h"
#import "RCTUtils.h"

@implementation RCTConvert (RCTModalHostView)

RCT_ENUM_CONVERTER(
    UIModalPresentationStyle,
    (@{
      @"fullScreen" : @(UIModalPresentationFullScreen),
#if !TARGET_OS_TV
      @"pageSheet" : @(UIModalPresentationPageSheet),
      @"formSheet" : @(UIModalPresentationFormSheet),
#endif
      @"overFullScreen" : @(UIModalPresentationOverFullScreen),
    }),
    UIModalPresentationFullScreen,
    integerValue)

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

@implementation RCTModalHostViewManager {
  NSPointerArray *_hostViews;
}

RCT_EXPORT_MODULE()

- (UIView *)view
{
  RCTModalHostView *view = [[RCTModalHostView alloc] initWithBridge:self.bridge];
  view.delegate = self;
  if (!_hostViews) {
    _hostViews = [NSPointerArray weakObjectsPointerArray];
  }
  [_hostViews addPointer:(__bridge void *)view];
  return view;
}

- (void)presentModalHostView:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.onShow) {
      modalHostView.onShow(nil);
    }
  };
  if (_presentationBlock) {
    _presentationBlock([modalHostView reactViewController], viewController, animated, completionBlock);
  } else {
    [[modalHostView reactViewController] presentViewController:viewController
                                                      animated:animated
                                                    completion:completionBlock];
  }
}

- (void)dismissModalHostView:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  if (_dismissalBlock) {
    _dismissalBlock([modalHostView reactViewController], viewController, animated, nil);
  } else {
    [viewController.presentingViewController dismissViewControllerAnimated:animated completion:nil];
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
  _hostViews = nil;
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
