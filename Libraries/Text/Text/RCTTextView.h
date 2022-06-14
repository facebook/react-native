/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>
#import <React/RCTEventDispatcher.h> // TODO(OSS Candidate ISS#2710739)

#import <React/RCTUIKit.h> // TODO(macOS GH#774)

NS_ASSUME_NONNULL_BEGIN

@interface RCTTextView : RCTUIView // TODO(macOS ISS#3536887)

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher; // TODO(OSS Candidate ISS#2710739)

@property (nonatomic, assign) BOOL selectable;

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<RCTUIView *> *)descendantViews; // TODO(macOS ISS#3536887)

@end

NS_ASSUME_NONNULL_END
