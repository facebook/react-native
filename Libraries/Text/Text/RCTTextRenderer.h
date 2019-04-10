/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

@interface RCTTextRenderer : NSObject <CALayerDelegate>

- (void)setTextStorage:(NSTextStorage *)textStorage contentFrame:(CGRect)contentFrame;

@end

NS_ASSUME_NONNULL_END
