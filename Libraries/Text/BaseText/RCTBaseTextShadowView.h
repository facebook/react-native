/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>

#import "RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const RCTBaseTextShadowViewEmbeddedShadowViewAttributeName;

@interface RCTBaseTextShadowView : RCTShadowView {
  @protected NSAttributedString *_Nullable cachedAttributedText;
  @protected RCTTextAttributes *_Nullable cachedTextAttributes;
}

@property (nonatomic, strong) RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END
