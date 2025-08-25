/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import "RCTBaseTextShadowView.h"

NS_ASSUME_NONNULL_BEGIN

@interface RCTTextShadowView : RCTBaseTextShadowView

- (instancetype)initWithBridge:(RCTBridge *)bridge
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, assign) NSInteger maximumNumberOfLines
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSLineBreakMode lineBreakMode
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL adjustsFontSizeToFit
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) CGFloat minimumFontScale
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTDirectEventBlock onTextLayout
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

- (void)uiManagerWillPerformMounting
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

NS_ASSUME_NONNULL_END

#endif // RCT_FIT_RM_OLD_COMPONENT
