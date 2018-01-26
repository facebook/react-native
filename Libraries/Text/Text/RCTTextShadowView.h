/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
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

- (void)uiManagerWillPerformMounting;

@end

NS_ASSUME_NONNULL_END
