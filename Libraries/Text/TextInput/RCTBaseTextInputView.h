/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTView.h>

#import "RCTBackedTextInputDelegate.h"
#import "RCTBackedTextInputViewProtocol.h"

@class RCTBridge;
@class RCTTextAttributes;
@class RCTTextSelection;

NS_ASSUME_NONNULL_BEGIN

@interface RCTBaseTextInputView : RCTView <RCTBackedTextInputDelegate>

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, strong, nullable) RCTTextAttributes *textAttributes;
@property (nonatomic, assign) UIEdgeInsets reactPaddingInsets;
@property (nonatomic, assign) UIEdgeInsets reactBorderInsets;

@property (nonatomic, copy, nullable) RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onSelectionChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onTextInput;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onScroll;

@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign, readonly) NSInteger nativeEventCount;
@property (nonatomic, assign) BOOL autoFocus;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, assign) BOOL secureTextEntry;
@property (nonatomic, copy) RCTTextSelection *selection;
@property (nonatomic, strong, nullable) NSNumber *maxLength;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy) NSString *inputAccessoryViewID;
@property (nonatomic, assign) UIKeyboardType keyboardType;
@property (nonatomic, assign) BOOL showSoftInputOnFocus;

/**
 Sets selection intext input if both start and end are within range of the text input.
 **/
- (void)setSelectionStart:(NSInteger)start
             selectionEnd:(NSInteger)end;

@end

NS_ASSUME_NONNULL_END
