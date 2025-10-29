/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

#import "RCTVirtualViewProtocol.h"

@class RCTScrollViewComponentView;

NS_ASSUME_NONNULL_BEGIN
@interface RCTVirtualViewContainerState : NSObject

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)new NS_UNAVAILABLE;
- (instancetype)initWithScrollView:(RCTScrollViewComponentView *)scrollView NS_DESIGNATED_INITIALIZER;

- (void)onChange:(id<RCTVirtualViewProtocol>)virtualView;
- (void)remove:(id<RCTVirtualViewProtocol>)virtualView;
@end

NS_ASSUME_NONNULL_END
