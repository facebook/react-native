// Copyright 2004-present Facebook. All Rights Reserved.

#import <React/RCTViewManager.h>

@class RCTWrapperView;

NS_ASSUME_NONNULL_BEGIN

@interface RCTWrapperViewManager : RCTViewManager

- (RCTWrapperView *)view NS_REQUIRES_SUPER;

@end

NS_ASSUME_NONNULL_END
