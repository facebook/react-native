/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTBaseTextShadowView.h"

#ifndef RCT_FIT_RM_OLD_COMPONENT

NS_ASSUME_NONNULL_BEGIN

@interface RCTBaseTextInputShadowView : RCTBaseTextShadowView

- (instancetype)initWithBridge:(RCTBridge *)bridge
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, copy, nullable) NSString *text
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) NSString *placeholder
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) NSInteger maximumNumberOfLines
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) RCTDirectEventBlock onContentSizeChange
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

- (void)uiManagerWillPerformMounting
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

NS_ASSUME_NONNULL_END

#endif // RCT_FIT_RM_OLD_COMPONENT
