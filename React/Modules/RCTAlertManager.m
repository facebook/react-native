/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTAlertManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTConvert (UIAlertViewStyle)

RCT_ENUM_CONVERTER(UIAlertViewStyle, (@{
  @"default": @(UIAlertViewStyleDefault),
  @"secure-text": @(UIAlertViewStyleSecureTextInput),
  @"plain-text": @(UIAlertViewStylePlainTextInput),
  @"login-password": @(UIAlertViewStyleLoginAndPasswordInput),
}), UIAlertViewStyleDefault, integerValue)

@end

@interface RCTAlertManager() <UIAlertViewDelegate>

@end

@implementation RCTAlertManager
{
  NSMutableArray<UIAlertView *> *_alerts;
  NSMutableArray<UIAlertController *> *_alertControllers;
  NSMutableArray<RCTResponseSenderBlock> *_alertCallbacks;
  NSMutableArray<NSArray<NSString *> *> *_alertButtonKeys;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  for (UIAlertView *alert in _alerts) {
    [alert dismissWithClickedButtonIndex:0 animated:YES];
  }
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
RCT_EXPORT_METHOD(alertWithArgs:(NSDictionary *)args
                  callback:(RCTResponseSenderBlock)callback)
{
  NSString *title = [RCTConvert NSString:args[@"title"]];
  NSString *message = [RCTConvert NSString:args[@"message"]];
  UIAlertViewStyle type = [RCTConvert UIAlertViewStyle:args[@"type"]];
  NSArray<NSDictionary *> *buttons = [RCTConvert NSDictionaryArray:args[@"buttons"]];
  NSString *defaultValue = [RCTConvert NSString:args[@"defaultValue"]];
  NSString *cancelButtonKey = [RCTConvert NSString:args[@"cancelButtonKey"]];
  NSString *destructiveButtonKey = [RCTConvert NSString:args[@"destructiveButtonKey"]];

  if (!title && !message) {
    RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  }

  if (buttons.count == 0) {
    if (type == UIAlertViewStyleDefault) {
      buttons = @[@{@"0": RCTUIKitLocalizedString(@"OK")}];
      cancelButtonKey = @"0";
    } else {
      buttons = @[
        @{@"0": RCTUIKitLocalizedString(@"OK")},
        @{@"1": RCTUIKitLocalizedString(@"Cancel")},
      ];
      cancelButtonKey = @"1";
    }
  }

  UIViewController *presentingController = RCTPresentedViewController();
  if (presentingController == nil) {
    RCTLogError(@"Tried to display alert view but there is no application window. args: %@", args);
    return;
  }

  UIAlertController *alertController = [UIAlertController
                                        alertControllerWithTitle:title
                                        message:nil
                                        preferredStyle:UIAlertControllerStyleAlert];
  switch (type) {
    case UIAlertViewStylePlainTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.secureTextEntry = NO;
        textField.text = defaultValue;
      }];
      break;
    }
    case UIAlertViewStyleSecureTextInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
        textField.text = defaultValue;
      }];
      break;
    }
    case UIAlertViewStyleLoginAndPasswordInput: {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = RCTUIKitLocalizedString(@"Login");
        textField.text = defaultValue;
      }];
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = RCTUIKitLocalizedString(@"Password");
        textField.secureTextEntry = YES;
      }];
      break;
    }
    case UIAlertViewStyleDefault:
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
    [alertController addAction:[UIAlertAction actionWithTitle:buttonTitle
                                                        style:buttonStyle
                                                      handler:^(__unused UIAlertAction *action) {
      switch (type) {
        case UIAlertViewStylePlainTextInput:
        case UIAlertViewStyleSecureTextInput:
          callback(@[buttonKey, [alertController.textFields.firstObject text]]);
          break;
        case UIAlertViewStyleLoginAndPasswordInput: {
          NSDictionary<NSString *, NSString *> *loginCredentials = @{
            @"login": [alertController.textFields.firstObject text],
            @"password": [alertController.textFields.lastObject text]
          };
          callback(@[buttonKey, loginCredentials]);
          break;
        }
        case UIAlertViewStyleDefault:
          callback(@[buttonKey]);
          break;
      }
    }]];
  }

  if (!_alertControllers) {
    _alertControllers = [NSMutableArray new];
  }
  [_alertControllers addObject:alertController];

  [presentingController presentViewController:alertController animated:YES completion:nil];
}

#pragma mark - UIAlertViewDelegate

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
  NSUInteger index = [_alerts indexOfObject:alertView];
  RCTAssert(index != NSNotFound, @"Dismissed alert was not recognised");

  RCTResponseSenderBlock callback = _alertCallbacks[index];
  NSArray<NSString *> *buttonKeys = _alertButtonKeys[index];

  switch (alertView.alertViewStyle) {
    case UIAlertViewStylePlainTextInput:
    case UIAlertViewStyleSecureTextInput:
      callback(@[buttonKeys[buttonIndex], [alertView textFieldAtIndex:0].text]);
      break;
    case UIAlertViewStyleLoginAndPasswordInput: {
      NSDictionary<NSString *, NSString *> *loginCredentials = @{
        @"login": [alertView textFieldAtIndex:0].text,
        @"password": [alertView textFieldAtIndex:1].text,
      };
      callback(@[buttonKeys[buttonIndex], loginCredentials]);
      break;
    }
    case UIAlertViewStyleDefault:
      callback(@[buttonKeys[buttonIndex]]);
      break;
  }

  [_alerts removeObjectAtIndex:index];
  [_alertCallbacks removeObjectAtIndex:index];
  [_alertButtonKeys removeObjectAtIndex:index];
}

@end
