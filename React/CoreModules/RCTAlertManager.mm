/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAlertManager.h"

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>
#import <React/RCTAssert.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUtils.h>

#import "CoreModulesPlugins.h"
#import "RCTAlertController.h"

@implementation RCTConvert (UIAlertViewStyle)

RCT_ENUM_CONVERTER(
    RCTAlertViewStyle,
    (@{
      @"default" : @(RCTAlertViewStyleDefault),
      @"secure-text" : @(RCTAlertViewStyleSecureTextInput),
      @"plain-text" : @(RCTAlertViewStylePlainTextInput),
      @"login-password" : @(RCTAlertViewStyleLoginAndPasswordInput),
    }),
    RCTAlertViewStyleDefault,
    integerValue)

@end

@interface RCTAlertManager () <NativeAlertManagerSpec>

@end

@implementation RCTAlertManager {
  NSHashTable *_alertControllers;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  for (UIAlertController *alertController in _alertControllers) {
    [alertController.presentingViewController dismissViewControllerAnimated:YES completion:nil];
  }
}

/**
 * @param {NSDictionary} args Dictionary of the form
 *
 *   @{
 *     @"message": @"<Alert message>",
 *     @"buttons": @[
 *       @{@"<key1>": @"<title1>"},
 *       @{@"<key2>": @"<title2>"},
 *     ],
 *     @"cancelButtonKey": @"<key2>",
 *   }
 * The key from the `buttons` dictionary is passed back in the callback on click.
 * Buttons are displayed in the order they are specified.
 */
RCT_EXPORT_METHOD(alertWithArgs : (JS::NativeAlertManager::Args &)args callback : (RCTResponseSenderBlock)callback)
{
  NSString *title = [RCTConvert NSString:args.title()];
  NSString *message = [RCTConvert NSString:args.message()];
  RCTAlertViewStyle type = [RCTConvert RCTAlertViewStyle:args.type()];
  NSArray<NSDictionary *> *buttons =
      [RCTConvert NSDictionaryArray:RCTConvertOptionalVecToArray(args.buttons(), ^id(id<NSObject> element) {
                    return element;
                  })];
  NSString *defaultValue = [RCTConvert NSString:args.defaultValue()];
  NSString *cancelButtonKey = [RCTConvert NSString:args.cancelButtonKey()];
  NSString *destructiveButtonKey = [RCTConvert NSString:args.destructiveButtonKey()];
  UIKeyboardType keyboardType = [RCTConvert UIKeyboardType:args.keyboardType()];

  if (!title && !message) {
    RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  }

  if (buttons.count == 0) {
    if (type == RCTAlertViewStyleDefault) {
      buttons = @[ @{@"0" : RCTUIKitLocalizedString(@"OK")} ];
      cancelButtonKey = @"0";
    } else {
      buttons = @[
        @{@"0" : RCTUIKitLocalizedString(@"OK")},
        @{@"1" : RCTUIKitLocalizedString(@"Cancel")},
      ];
      cancelButtonKey = @"1";
    }
  }

  RCTAlertController *alertController = [RCTAlertController alertControllerWithTitle:title
                                                                             message:nil
                                                                      preferredStyle:UIAlertControllerStyleAlert];
  switch (type) {
    case RCTAlertViewStylePlainTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.secureTextEntry = NO;
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      break;
    }
    case RCTAlertViewStyleSecureTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      break;
    }
    case RCTAlertViewStyleLoginAndPasswordInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = RCTUIKitLocalizedString(@"Login");
        textField.text = defaultValue;
        textField.keyboardType = keyboardType;
      }];
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
      }];
      break;
    }
    case RCTAlertViewStyleDefault:
      break;
  }

  alertController.message = message;

  for (NSDictionary<NSString *, id> *button in buttons) {
    if (button.count != 1) {
      RCTLogError(@"Button definitions should have exactly one key.");
    }
    NSString *buttonKey = button.allKeys.firstObject;
    NSString *buttonTitle = [RCTConvert NSString:button[buttonKey]];
    UIAlertActionStyle buttonStyle = UIAlertActionStyleDefault;
    if ([buttonKey isEqualToString:cancelButtonKey]) {
      buttonStyle = UIAlertActionStyleCancel;
    } else if ([buttonKey isEqualToString:destructiveButtonKey]) {
      buttonStyle = UIAlertActionStyleDestructive;
    }
    __weak RCTAlertController *weakAlertController = alertController;
    [alertController
        addAction:[UIAlertAction
                      actionWithTitle:buttonTitle
                                style:buttonStyle
                              handler:^(__unused UIAlertAction *action) {
                                switch (type) {
                                  case RCTAlertViewStylePlainTextInput:
                                  case RCTAlertViewStyleSecureTextInput:
                                    callback(@[ buttonKey, [weakAlertController.textFields.firstObject text] ]);
                                    break;
                                  case RCTAlertViewStyleLoginAndPasswordInput: {
                                    NSDictionary<NSString *, NSString *> *loginCredentials = @{
                                      @"login" : [weakAlertController.textFields.firstObject text],
                                      @"password" : [weakAlertController.textFields.lastObject text]
                                    };
                                    callback(@[ buttonKey, loginCredentials ]);
                                    break;
                                  }
                                  case RCTAlertViewStyleDefault:
                                    callback(@[ buttonKey ]);
                                    break;
                                }
                              }]];
  }

  if (!_alertControllers) {
    _alertControllers = [NSHashTable weakObjectsHashTable];
  }
  [_alertControllers addObject:alertController];

  dispatch_async(dispatch_get_main_queue(), ^{
    [alertController show:YES completion:nil];
  });
}

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
  return std::make_shared<facebook::react::NativeAlertManagerSpecJSI>(params);
}

@end

Class RCTAlertManagerCls(void)
{
  return RCTAlertManager.class;
}
