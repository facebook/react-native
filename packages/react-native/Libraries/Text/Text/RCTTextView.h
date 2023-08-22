/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>

#import <UIKit/UIKit.h>

NS_ASSUME_NONNULL_BEGIN

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
