/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTShadowView.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import "RCTTextAttributes.h"

NS_ASSUME_NONNULL_BEGIN

extern NSString *const RCTBaseTextShadowViewEmbeddedShadowViewAttributeName
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTBaseTextShadowView : RCTShadowView {
 @protected
  NSAttributedString *_Nullable cachedAttributedText;
 @protected
  RCTTextAttributes *_Nullable cachedTextAttributes;
}

@property (nonatomic, strong) RCTTextAttributes *textAttributes;

- (NSAttributedString *)attributedTextWithBaseTextAttributes:(nullable RCTTextAttributes *)baseTextAttributes;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_ARCH
