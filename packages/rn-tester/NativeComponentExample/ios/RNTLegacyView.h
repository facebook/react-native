/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>
#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RNTLegacyView : UIView

@property (nonatomic, copy) RCTBubblingEventBlock onColorChanged;

@end

NS_ASSUME_NONNULL_END
