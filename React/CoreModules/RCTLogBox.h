/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridge.h>
#import <React/RCTBridgeModule.h>
#import <React/RCTErrorCustomizer.h>

@class RCTJSStackFrame;

@interface RCTLogBox : NSObject <RCTBridgeModule>

- (void)show;
- (void)hide;

@end
