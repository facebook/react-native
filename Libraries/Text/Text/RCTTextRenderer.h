/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

/**
 * Used by text layers to render text. Note that UIKit crashes if this delegate is implemented
 * directly on a UIView subclass since it already implements it for the view's root
 * layer. This is why this is implemented in a separate class.
 */
@interface RCTTextRenderer : NSObject <CALayerDelegate>

- (void)setTextStorage:(NSTextStorage *)textStorage contentFrame:(CGRect)contentFrame;

@end

NS_ASSUME_NONNULL_END
