/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

@protocol RCTBackedTextInputViewProtocol <UITextInput>

@property (nonatomic, copy, nullable) NSString *text;
@property (nonatomic, strong, nullable) UIColor *textColor;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;
@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, strong, nullable) UIFont *font;
@property (nonatomic, assign) UIEdgeInsets textContainerInset;
@property (nonatomic, strong, nullable) UIView *inputAccessoryView;
@property (nonatomic, readonly) CGSize contentSize;

@end
