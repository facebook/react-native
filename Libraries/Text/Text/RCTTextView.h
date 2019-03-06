/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

<<<<<<< HEAD
#import <React/RCTUIKit.h> // TODO(macOS ISS#2323203)
=======
#import <React/RCTComponent.h>

#import <UIKit/UIKit.h>
>>>>>>> v0.58.6

NS_ASSUME_NONNULL_BEGIN

@interface RCTTextView : UIView

@property (nonatomic, assign) BOOL selectable;

- (void)setTextStorage:(NSTextStorage *)textStorage
          contentFrame:(CGRect)contentFrame
       descendantViews:(NSArray<UIView *> *)descendantViews;

@end

NS_ASSUME_NONNULL_END
