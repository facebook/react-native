/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTViewComponentView.h"
#import <React/RCTImageResponseDelegate.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * UIView class for root <Image> component.
 */
@interface RCTImageComponentView : RCTViewComponentView <RCTImageResponseDelegate>

@end

NS_ASSUME_NONNULL_END
