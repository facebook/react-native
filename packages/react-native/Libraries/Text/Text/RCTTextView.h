/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>

#ifndef RCT_REMOVE_LEGACY_ARCH

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

__attribute__((deprecated("This API will be removed along with the legacy architecture.")))
@interface RCTTextView : UIView

@property (nonatomic, assign) BOOL selectable;

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<UIView *> *)descendantViews;

/**
 * (Experimental and unused for Paper) Pointer event handlers.
 */
@property (nonatomic, assign) RCTBubblingEventBlock onClick;

@end

NS_ASSUME_NONNULL_END

#endif // RCT_REMOVE_LEGACY_ARCH
