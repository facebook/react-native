/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <UIKit/UIKit.h>

#import <React/RCTBridgeModule.h>
#import <React/RCTInvalidating.h>

typedef NS_ENUM(NSInteger, RCTAlertViewStyle) {
  RCTAlertViewStyleDefault = 0,
  RCTAlertViewStyleSecureTextInput,
  RCTAlertViewStylePlainTextInput,
  RCTAlertViewStyleLoginAndPasswordInput
};

@interface RCTAlertManager : NSObject <RCTBridgeModule, RCTInvalidating>

@end
