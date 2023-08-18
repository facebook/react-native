/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalHostViewManager.h"

#import "RCTBridge.h"
#import "RCTModalHostView.h"
#import "RCTModalHostViewController.h"
#import "RCTModalManager.h"
#import "RCTShadowView.h"
#import "RCTUtils.h"

@implementation RCTConvert (RCTModalHostView)

RCT_ENUM_CONVERTER(
    UIModalPresentationStyle,
    (@{
      @"fullScreen" : @(UIModalPresentationFullScreen),
      @"pageSheet" : @(UIModalPresentationPageSheet),
      @"formSheet" : @(UIModalPresentationFormSheet),
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
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_presentationBlock) {
      self->_presentationBlock([modalHostView reactViewController], viewController, animated, completionBlock);
    } else {
      UIViewController* presentingViewController;
      // pageSheet and formSheet presentation style animate the presented view so we need to use the last presented view controller
      // For other presentation styles we use the new window
      if (modalHostView.presentationStyle == UIModalPresentationPageSheet || modalHostView.presentationStyle == UIModalPresentationFormSheet) {
        UIViewController *lastPresentedViewController = RCTKeyWindow().rootViewController;
        UIViewController *presentedViewController = nil;
        while (lastPresentedViewController != nil) {
          presentedViewController = lastPresentedViewController;
          lastPresentedViewController = lastPresentedViewController.presentedViewController;
        }
        presentingViewController = presentedViewController;
      } else {
        modalHostView.modalWindow = [[UIWindow alloc] initWithFrame:UIScreen.mainScreen.bounds];
        modalHostView.modalWindow.windowLevel = UIWindowLevelAlert;
        UIViewController *newViewController = [[UIViewController alloc] init];
        modalHostView.modalWindow.rootViewController = newViewController;
        [modalHostView.modalWindow makeKeyAndVisible];
        presentingViewController = newViewController;
      }
      [presentingViewController presentViewController:viewController animated:animated completion:completionBlock];
    }
  });
}

- (void)dismissModalHostViewWithCompletion:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated completion:(void (^)(void))completion
{
  dispatch_block_t completionBlock = ^{
    if (modalHostView.identifier) {
      [[self.bridge moduleForClass:[RCTModalManager class]] modalDismissed:modalHostView.identifier];
    }
    if (completion) {
      completion();
    }
    modalHostView.modalWindow = nil;
  };
  dispatch_async(dispatch_get_main_queue(), ^{
    if (self->_dismissalBlock) {
      self->_dismissalBlock([modalHostView reactViewController], viewController, animated, completionBlock);
    } else {
      // Will be true for pageSheet and formSheet presentation styles
      // We dismiss the nested modal and then dismiss the current modal
      if (viewController.presentedViewController != nil && [viewController.presentedViewController isKindOfClass:[RCTModalHostViewController class]]) {
        RCTModalHostViewController* presentedModalViewController = (RCTModalHostViewController *)viewController.presentedViewController;
        dispatch_block_t childModalCompletionBlock = ^{
          [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
        };

        [presentedModalViewController.modalHostView dismissModalViewControllerWithCompletion: childModalCompletionBlock];
      } else {
        [viewController.presentingViewController dismissViewControllerAnimated:animated completion:completionBlock];
      }
    }
  });
}

- (void)dismissModalHostView:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
{
  [self dismissModalHostViewWithCompletion:modalHostView withViewController:viewController animated:animated completion:nil];
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
RCT_EXPORT_VIEW_PROPERTY(statusBarTranslucent, BOOL)
RCT_EXPORT_VIEW_PROPERTY(hardwareAccelerated, BOOL)
RCT_EXPORT_VIEW_PROPERTY(animated, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onShow, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(identifier, NSNumber)
RCT_EXPORT_VIEW_PROPERTY(supportedOrientations, NSArray)
RCT_EXPORT_VIEW_PROPERTY(onOrientationChange, RCTDirectEventBlock)
RCT_EXPORT_VIEW_PROPERTY(visible, BOOL)
RCT_EXPORT_VIEW_PROPERTY(onRequestClose, RCTDirectEventBlock)

// Fabric only
RCT_EXPORT_VIEW_PROPERTY(onDismiss, RCTDirectEventBlock)

@end
