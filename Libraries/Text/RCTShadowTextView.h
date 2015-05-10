/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTAttributedStringHandler.h"
#import "RCTShadowView.h"

@interface RCTShadowTextView : RCTShadowView

// Not exposed to JS
@property (nonatomic, copy, readonly) NSAttributedString *attributedString;
@property (nonatomic, copy, readonly) NSAttributedString *attributedPlaceholderString;

// Used to calculate the height of the UITextView
@property (nonatomic, strong, readonly) NSLayoutManager *layoutManager;
@property (nonatomic, strong, readonly) NSTextContainer *textContainer;


// Exposed to JS
// Update the text of the text field. ( Resets the current text field. )
@property (nonatomic, copy) NSString *text;
// Updates only the value of the shadow text updateTextView is set to false.
// This is used to persist updates from TextInput.js back to the ShadowView wihtout reloading the UITextField.
- (void)setText:(NSString *)text updateTextView:(BOOL)updateTextView;
@property (nonatomic, copy) NSString *placeholder;

// Styling Text and placeholder text.
@property (nonatomic, strong) UIColor *textColor;
@property (nonatomic, strong) UIColor *placeholderTextColor;

@property (nonatomic, assign) NSWritingDirection writingDirection;
@property (nonatomic, strong) UIColor *textBackgroundColor;
@property (nonatomic, copy) NSString *fontFamily;
@property (nonatomic, assign) CGFloat fontSize;
@property (nonatomic, copy) NSString *fontWeight;
@property (nonatomic, copy) NSString *fontStyle;
@property (nonatomic, assign) BOOL isHighlighted;
@property (nonatomic, assign) CGFloat lineHeight;
@property (nonatomic, assign) NSTextAlignment textAlign;

@end
