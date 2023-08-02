/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTUIKit.h> // [macOS]

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

@property (nonatomic, readonly) RCTUIView<RCTBackedTextInputViewProtocol> *backedTextInputView; // [macOS]

/**
 Whether this text input ignores the `textAttributes` property. Defaults to `NO`. If set to `YES`, the value of `textAttributes` will be ignored in favor of standard text input behavior.
 */
@property (nonatomic) BOOL ignoresTextAttributes; // [macOS]
@property (nonatomic, strong, nullable) RCTTextAttributes *textAttributes;
@property (nonatomic, assign) UIEdgeInsets reactPaddingInsets;
@property (nonatomic, assign) UIEdgeInsets reactBorderInsets;

@property (nonatomic, copy, nullable) RCTDirectEventBlock onContentSizeChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onSelectionChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onChange;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onPaste; // [macOS]
@property (nonatomic, copy, nullable) RCTDirectEventBlock onChangeSync;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onTextInput;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onScroll;
#if TARGET_OS_OSX // [macOS
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onAutoCorrectChange;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onSpellCheckChange;
@property (nonatomic, copy, nullable) RCTBubblingEventBlock onGrammarCheckChange;
@property (nonatomic, assign) BOOL clearTextOnSubmit;
@property (nonatomic, copy, nullable) RCTDirectEventBlock onSubmitEditing;
@property (nonatomic, copy) NSArray<NSDictionary *> *submitKeyEvents;
@property (nonatomic, strong, nullable) RCTUIColor *cursorColor;
#endif // macOS]
@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, assign, readonly) NSInteger nativeEventCount;
@property (nonatomic, assign) BOOL autoFocus;
@property (nonatomic, copy) NSString *submitBehavior;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, assign) BOOL secureTextEntry;
@property (nonatomic, copy) RCTTextSelection *selection;
@property (nonatomic, strong, nullable) NSNumber *maxLength;
@property (nonatomic, copy, nullable) NSAttributedString *attributedText;
@property (nonatomic, copy) NSString *predictedText; // [macOS]
@property (nonatomic, copy) NSString *inputAccessoryViewID;
#if !TARGET_OS_OSX // [macOS]
@property (nonatomic, assign) UIKeyboardType keyboardType;
@property (nonatomic, assign) BOOL showSoftInputOnFocus;
#endif // [macOS]

@property (nonatomic, copy, nullable) NSString *ghostText; // [macOS]

/**
 Sets selection intext input if both start and end are within range of the text input.
 **/
- (void)setSelectionStart:(NSInteger)start selectionEnd:(NSInteger)end;

@end

NS_ASSUME_NONNULL_END
