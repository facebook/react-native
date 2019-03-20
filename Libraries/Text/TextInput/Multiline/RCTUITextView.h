/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import "RCTBackedTextInputViewProtocol.h"

#import "RCTBackedTextInputDelegate.h"

NS_ASSUME_NONNULL_BEGIN

/*
 * Just regular UITextView... but much better!
 */
@interface RCTUITextView : UITextView <RCTBackedTextInputViewProtocol>

- (instancetype)initWithFrame:(CGRect)frame textContainer:(nullable NSTextContainer *)textContainer NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;

@property (nonatomic, weak) id<RCTBackedTextInputDelegate> textInputDelegate;

@property (nonatomic, assign) BOOL contextMenuHidden;
@property (nonatomic, assign, readonly) BOOL textWasPasted;
@property (nonatomic, copy, nullable) NSString *placeholder;
@property (nonatomic, strong, nullable) UIColor *placeholderColor;

@property (nonatomic, assign) CGFloat preferredMaxLayoutWidth;

// The `clearButtonMode` property actually is not supported yet;
// it's declared here only to conform to the interface.
@property (nonatomic, assign) UITextFieldViewMode clearButtonMode;

// The `caretHidden` property actually is not supported yet;
// it's declared here only to conform to the interface.
@property (nonatomic, assign) BOOL caretHidden;

@end

NS_ASSUME_NONNULL_END
