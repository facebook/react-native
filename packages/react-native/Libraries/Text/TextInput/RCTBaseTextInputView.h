/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#ifndef RCT_FIT_RM_OLD_COMPONENT

#import <React/RCTView.h>

#import "RCTBackedTextInputDelegate.h"
#import "RCTBackedTextInputViewProtocol.h"

@class RCTBridge;
@class RCTTextAttributes;
@class RCTTextSelection;

NS_ASSUME_NONNULL_BEGIN

@interface RCTBaseTextInputView : RCTView <RCTBackedTextInputDelegate>

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<RCTBackedTextInputViewProtocol> *backedTextInputView
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, strong, nullable) RCTTextAttributes *textAttributes
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) UIEdgeInsets reactPaddingInsets
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) UIEdgeInsets reactBorderInsets
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, copy, nullable) RCTDirectEventBlock onContentSizeChange
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) RCTDirectEventBlock onSelectionChange
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) RCTDirectEventBlock onChange
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) RCTDirectEventBlock onChangeSync
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) RCTDirectEventBlock onScroll
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@property (nonatomic, assign) NSInteger mostRecentEventCount
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign, readonly) NSInteger nativeEventCount
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL autoFocus
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) NSString *submitBehavior
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL selectTextOnFocus
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL clearTextOnFocus
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL secureTextEntry
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) RCTTextSelection *selection
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, strong, nullable) NSNumber *maxLength
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy, nullable) NSAttributedString *attributedText
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, copy) NSString *inputAccessoryViewID
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, strong) NSString *inputAccessoryViewButtonLabel
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) UIKeyboardType keyboardType
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));
@property (nonatomic, assign) BOOL showSoftInputOnFocus
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

/**
 Sets selection intext input if both start and end are within range of the text input.
 **/
- (void)setSelectionStart:(NSInteger)start
             selectionEnd:(NSInteger)end
    __attribute__((deprecated("This API will be removed along with the legacy architecture.")));

@end

NS_ASSUME_NONNULL_END

#endif // RCT_FIT_RM_OLD_COMPONENT
