/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTBaseTextShadowView.h"

NS_ASSUME_NONNULL_BEGIN

@interface RCTBaseTextInputShadowView : RCTBaseTextShadowView

- (instancetype)initWithBridge:(RCTBridge *)bridge;

@property (nonatomic, copy, nullable) NSString *text;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, assign) NSInteger maximumNumberOfLines;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onContentSizeChange;

- (void)uiManagerWillPerformMounting;

@end

NS_ASSUME_NONNULL_END
