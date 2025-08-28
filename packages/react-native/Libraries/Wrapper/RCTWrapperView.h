/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

typedef CGSize (^RCTWrapperMeasureBlock)(CGSize minimumSize, CGSize maximumSize)
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@class RCTBridge;

NS_ASSUME_NONNULL_BEGIN

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTWrapperView : UIView

@property (nonatomic, retain, nullable) UIView *contentView;
@property (nonatomic, readonly) RCTWrapperMeasureBlock measureBlock;

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

#pragma mark - Restrictions

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

- (void)addSubview:(UIView *)view NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view atIndex:(NSInteger)index NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view aboveSubview:(UIView *)siblingSubview NS_UNAVAILABLE;
- (void)insertSubview:(UIView *)view belowSubview:(UIView *)siblingSubview NS_UNAVAILABLE;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_FIT_RM_OLD_COMPONENT
