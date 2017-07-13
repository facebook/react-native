/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTBackedTextInputViewProtocol.h"

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextView... but much better!
 */
@interface RCTUITextView : UITextView <RCTBackedTextInputViewProtocol>

- (instancetype)initWithFrame:(CGRect)frame textContainer:(nullable NSTextContainer *)textContainer NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)aDecoder NS_UNAVAILABLE;

@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

@end

NS_ASSUME_NONNULL_END
