// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

typedef CGSize (^RCTWrapperMeasureBlock)(CGSize minimumSize, CGSize maximumSize);

@class RCTBridge;

NS_ASSUME_NONNULL_BEGIN

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
