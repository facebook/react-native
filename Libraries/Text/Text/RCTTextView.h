/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>
#import <React/RCTEventDispatcher.h> // [macOS]

#import <React/RCTUIKit.h> // [macOS]

NS_ASSUME_NONNULL_BEGIN

@interface RCTTextView : RCTUIView // [macOS]

- (instancetype)initWithEventDispatcher:(id<RCTEventDispatcherProtocol>)eventDispatcher; // [macOS]

@property (nonatomic, assign) BOOL selectable;

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<RCTUIView *> *)descendantViews; // [macOS]

@end

NS_ASSUME_NONNULL_END
