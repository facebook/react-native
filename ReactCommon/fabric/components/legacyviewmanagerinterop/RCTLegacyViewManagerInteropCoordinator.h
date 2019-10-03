/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTViewManager;

@interface RCTLegacyViewManagerInteropCoordinator : NSObject

- (instancetype)initWithViewManager:(RCTViewManager *)viewManager;

- (UIView *)view;

@end

NS_ASSUME_NONNULL_END
