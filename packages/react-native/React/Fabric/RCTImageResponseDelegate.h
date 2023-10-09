/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@protocol RCTImageResponseDelegate <NSObject>

- (void)didReceiveImage:(UIImage *)image metadata:(id)metadata fromObserver:(const void *)observer;
- (void)didReceiveProgress:(float)progress fromObserver:(const void *)observer;
- (void)didReceiveFailureFromObserver:(const void *)observer;

@end

NS_ASSUME_NONNULL_END
