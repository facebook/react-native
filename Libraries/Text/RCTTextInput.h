/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <UIKit/UIKit.h>

#import <React/RCTView.h>

#import "RCTBackedTextInputViewProtocol.h"

@class RCTBridge;
@class RCTEventDispatcher;

@interface RCTTextInput : RCTView {
@protected
  RCTBridge *_bridge;
  RCTEventDispatcher *_eventDispatcher;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge NS_DESIGNATED_INITIALIZER;

- (instancetype)init NS_UNAVAILABLE;
- (instancetype)initWithCoder:(NSCoder *)decoder NS_UNAVAILABLE;
- (instancetype)initWithFrame:(CGRect)frame NS_UNAVAILABLE;

@property (nonatomic, readonly) UIView<RCTBackedTextInputViewProtocol> *backedTextInputView;

@property (nonatomic, assign) UIEdgeInsets reactPaddingInsets;
@property (nonatomic, assign) UIEdgeInsets reactBorderInsets;
@property (nonatomic, assign, readonly) CGSize contentSize;

@property (nonatomic, copy) RCTDirectEventBlock onContentSizeChange;

- (void)invalidateContentSize;

@end
