/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTComponent.h>

#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)

NS_ASSUME_NONNULL_BEGIN

@interface RCTTextView : RCTUIView // TODO(macOS ISS#3536887)

@property (nonatomic, assign) BOOL selectable;

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<RCTUIView *> *)descendantViews; // TODO(macOS ISS#3536887)

@end

NS_ASSUME_NONNULL_END
