/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import "RCTView.h"
#import "UIView+React.h"

@class RCTEventDispatcher;

@interface RCTTextView : RCTView <UITextViewDelegate>

// exposed to JS
@property (nonatomic, assign) BOOL autoCorrect;
@property (nonatomic, assign) BOOL clearTextOnFocus;
@property (nonatomic, assign) BOOL selectTextOnFocus;
@property (nonatomic, assign) UIEdgeInsets contentInset;
@property (nonatomic, assign) BOOL automaticallyAdjustContentInsets;
@property (nonatomic, assign) NSUInteger maximumNumberOfLines;

// Not exposed to JS
@property (nonatomic, copy) NSAttributedString *attributedText;
@property (nonatomic, copy) NSAttributedString *attributedPlaceholderText;

- (instancetype)initWithEventDispatcher:(RCTEventDispatcher *)eventDispatcher NS_DESIGNATED_INITIALIZER;

@end
