/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTComponent.h>

@class RCTEventDispatcher;
@class  RCTTextField;

// input View Accessory Handle definition
typedef UIView * (^RCTTextFieldKeyboardAccessory)(RCTTextField *);

@interface RCTTextField : UITextField

@property (nonatomic, assign) BOOL caretHidden;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) BOOL blurOnSubmit;
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, strong) UIColor *placeholderTextColor;
@property (nonatomic, assign) NSInteger mostRecentEventCount;
@property (nonatomic, strong) NSNumber *maxLength;
@property (nonatomic, assign) BOOL textWasPasted;

@property (nonatomic, copy) RCTDirectEventBlock onSelectionChange;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

- (void)textFieldDidChange;
- (void)sendKeyValueForString:(NSString *)string;
- (BOOL)textFieldShouldEndEditing:(RCTTextField *)textField;

/*
 * This method was exposed as public to enable accessory handle to submit changes to JS code
 */
- (void)textFieldSubmitEditing;


/**
 * The method to allow application register handle to produce inputAccessoryView for particular keyboard type
 * handler presents instancdispatch_oncee of KeyboardAccessory type
 */

+(void) registerKeyboardTypeAccessoryHandler:(UIKeyboardType)type handler:(RCTTextFieldKeyboardAccessory)handler;


@end

