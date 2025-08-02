/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>
#import <React/RCTScrollViewComponentView.h>
#import <UIKit/UIKit.h>

#import "RCTVirtualViewProtocol.h"

NS_ASSUME_NONNULL_BEGIN
@class RCTScrollViewComponentView;
@interface RCTVirtualViewContainerState : NSObject

- (instancetype)init NS_UNAVAILABLE;
@property (nonatomic, assign, readonly) CGFloat prerenderRatio;
@property (nonatomic, assign, readonly) BOOL detectWindowFocus;
@property (nonatomic, strong, readonly) NSMutableSet<id<RCTVirtualViewProtocol>> *virtualViews;
@property (nonatomic, assign, readonly) CGRect emptyRect;
@property (nonatomic, assign, readonly) CGRect visibleRect;
@property (nonatomic, assign, readonly) CGRect prerenderRect;
@property (nonatomic, weak, readonly) RCTScrollViewComponentView *scrollViewComponentView;
// Designated initializer
- (instancetype)initWithScrollView:(RCTScrollViewComponentView *)scrollView NS_DESIGNATED_INITIALIZER;
// Cleanup resources
- (void)cleanup;
// Handle changes to a virtual view
- (void)onChange:(id<RCTVirtualViewProtocol>)virtualView;
// Remove a virtual view
- (void)remove:(id<RCTVirtualViewProtocol>)virtualView;
@end

NS_ASSUME_NONNULL_END
