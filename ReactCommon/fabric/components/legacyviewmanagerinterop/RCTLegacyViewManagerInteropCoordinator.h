/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <UIKit/UIKit.h>
#include <folly/dynamic.h>

NS_ASSUME_NONNULL_BEGIN

@class RCTComponentData;

@interface RCTLegacyViewManagerInteropCoordinator : NSObject

- (instancetype)initWithComponentData:(RCTComponentData *)componentData;

- (UIView *)view;

- (void)setProps:(folly::dynamic const &)props forView:(UIView *)view;

@end

NS_ASSUME_NONNULL_END
