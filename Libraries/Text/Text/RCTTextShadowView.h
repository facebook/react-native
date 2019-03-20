/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>

#import "RCTBaseTextShadowView.h"

NS_ASSUME_NONNULL_BEGIN

@interface RCTTextShadowView : RCTBaseTextShadowView

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@property (nonatomic, assign) NSInteger maximumNumberOfLines;
@property (nonatomic, assign) NSLineBreakMode lineBreakMode;
@property (nonatomic, assign) BOOL adjustsFontSizeToFit;
@property (nonatomic, assign) CGFloat minimumFontScale;
@property (nonatomic, copy) RCTDirectEventBlock onTextLayout;

- (void)uiManagerWillPerformMounting;

@end

NS_ASSUME_NONNULL_END
