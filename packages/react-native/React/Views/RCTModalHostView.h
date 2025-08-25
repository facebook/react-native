/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTInvalidating.h>
#import <React/RCTModalHostViewManager.h>
#import <React/RCTView.h>

@class RCTBridge;
@class RCTModalHostViewController;

@protocol RCTModalHostViewInteractor;

@interface RCTModalHostView : UIView <RCTInvalidating, UIAdaptivePresentationControllerDelegate>

@property (nonatomic, copy) NSString *animationType
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) UIModalPresentationStyle presentationStyle
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign, getter=isTransparent) BOOL transparent
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, copy) RCTDirectEventBlock onShow
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL visible
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL allowSwipeDismissal
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

// Android only
@property (nonatomic, assign) BOOL statusBarTranslucent
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL hardwareAccelerated
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL animated
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, copy) NSNumber *identifier
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, weak) id<RCTModalHostViewInteractor> delegate
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, copy) NSArray<NSString *> *supportedOrientations
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTDirectEventBlock onOrientationChange
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

// Fabric only
@property (nonatomic, copy) RCTDirectEventBlock onDismiss
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

@protocol RCTModalHostViewInteractor <NSObject>

- (void)presentModalHostView:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
- (void)dismissModalHostView:(RCTModalHostView *)modalHostView
          withViewController:(RCTModalHostViewController *)viewController
                    animated:(BOOL)animated
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

#endif // RCT_FIT_RM_OLD_COMPONENT
