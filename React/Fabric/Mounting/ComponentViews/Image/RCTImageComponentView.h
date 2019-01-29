/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTViewComponentView.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTImageResponseDelegate <NSObject>

- (void)didReceiveImage:(UIImage *)image fromObserver:(void*)observer;
- (void)didReceiveProgress:(float)progress fromObserver:(void*)observer;
- (void)didReceiveFailureFromObserver:(void*)observer;

@end

/**
 * UIView class for root <Image> component.
 */
@interface RCTImageComponentView : RCTViewComponentView <RCTImageResponseDelegate>

@end

NS_ASSUME_NONNULL_END
