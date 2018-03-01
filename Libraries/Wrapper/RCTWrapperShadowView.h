// Copyright 2004-present Facebook. All Rights Reserved.

#import <UIKit/UIKit.h>

#import <React/RCTShadowView.h>

@class RCTBridge;

NS_ASSUME_NONNULL_BEGIN

@interface RCTWrapperShadowView : RCTShadowView

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

@end

NS_ASSUME_NONNULL_END
