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

static NSString* RCTAlertTypePlainText = @"plain-text";
static NSString* RCTAlertTypeSecure = @"secure";
static NSString* RCTAlertTypeLoginAndPassword = @"login-password";

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
 *       @{@"<key2>": @"<cancelButtonTitle>"},
 *     ]
 *   }
 * The key from the `buttons` dictionary is passed back in the callback on click.
 * Buttons are displayed in the order they are specified. If "cancel" is used as
 * the button key, it will be differently highlighted, according to iOS UI conventions.
 */
RCT_EXPORT_METHOD(alertWithArgs:(NSDictionary *)args
                  callback:(RCTResponseSenderBlock)callback)
{
  NSString *title = [RCTConvert NSString:args[@"title"]];
  NSString *message = [RCTConvert NSString:args[@"message"]];
  NSString *type = [RCTConvert NSString:args[@"type"]];
  NSDictionaryArray *buttons = [RCTConvert NSDictionaryArray:args[@"buttons"]];

  if (!title && !message) {
    RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  } else if (buttons.count == 0) {
    RCTLogError(@"Must have at least one button.");
    return;
  }

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  // TODO: we've encountered some bug when presenting alerts on top of a window that is subsequently
  // dismissed. As a temporary solution to this, we'll use UIAlertView preferentially if it's available.
  BOOL preferAlertView = (!RCTRunningInAppExtension() && UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPhone);

  if (preferAlertView || [UIAlertController class] == nil) {

    UIAlertView *alertView = RCTAlertView(title, nil, self, nil, nil);
    NSMutableArray<NSString *> *buttonKeys = [[NSMutableArray alloc] initWithCapacity:buttons.count];

    if ([type isEqual:RCTAlertTypePlainText]) {
      alertView.alertViewStyle = UIAlertViewStylePlainTextInput;
    } else if ([type isEqual:RCTAlertTypeSecure]) {
      alertView.alertViewStyle = UIAlertViewStyleSecureTextInput;
    } else if ([type isEqual:RCTAlertTypeLoginAndPassword]) {
      alertView.alertViewStyle = UIAlertViewStyleLoginAndPasswordInput;
    } else if (type.length) {
      RCTLogError(@"Entered invalid type. Valid types: '%@', '%@', '%@'", RCTAlertTypePlainText, RCTAlertTypeSecure, RCTAlertTypeLoginAndPassword);
      return;
    }

    alertView.message = message;

    NSInteger index = 0;
    for (NSDictionary *button in buttons) {
      if (button.count != 1) {
        RCTLogError(@"Button definitions should have exactly one key.");
      }
      NSString *buttonKey = button.allKeys.firstObject;
      NSString *buttonTitle = [button[buttonKey] description];
      [alertView addButtonWithTitle:buttonTitle];
      if ([buttonKey isEqualToString:@"cancel"]) {
        alertView.cancelButtonIndex = index;
      }
      [buttonKeys addObject:buttonKey];
      index ++;
    }

    if (!_alerts) {
      _alerts = [NSMutableArray new];
      _alertCallbacks = [NSMutableArray new];
      _alertButtonKeys = [NSMutableArray new];
    }
    [_alerts addObject:alertView];
    [_alertCallbacks addObject:callback ?: ^(__unused id unused) {}];
    [_alertButtonKeys addObject:buttonKeys];

    [alertView show];

  } else

#endif

  {
    UIViewController *presentingController = RCTKeyWindow().rootViewController;
    if (presentingController == nil) {
      RCTLogError(@"Tried to display alert view but there is no application window. args: %@", args);
      return;
    }

    // Walk the chain up to get the topmost modal view controller. If modals are presented,
    // the root view controller's view might not be in the window hierarchy, and presenting from it will fail.
    while (presentingController.presentedViewController) {
      presentingController = presentingController.presentedViewController;
    }

    UIAlertController *alertController =
    [UIAlertController alertControllerWithTitle:title
                                        message:nil
                                 preferredStyle:UIAlertControllerStyleAlert];

    if ([type isEqual:RCTAlertTypePlainText]) {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.secureTextEntry = NO;
      }];
    } else if ([type isEqual:RCTAlertTypeSecure]) {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = @"Password";
        textField.secureTextEntry = YES;
      }];
    } else if ([type isEqual: RCTAlertTypeLoginAndPassword]) {
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = @"Login";
      }];
      [alertController addTextFieldWithConfigurationHandler:^(UITextField *textField) {
        textField.placeholder = @"Password";
        textField.secureTextEntry = YES;
      }];
    } else if (type.length) {
      RCTLogError(@"Entered invalid type. Valid types: '%@', '%@', '%@'", RCTAlertTypePlainText, RCTAlertTypeSecure, RCTAlertTypeLoginAndPassword);
      return;
    }

    alertController.message = message;

    for (NSDictionary *button in buttons) {
      if (button.count != 1) {
        RCTLogError(@"Button definitions should have exactly one key.");
      }
      NSString *buttonKey = button.allKeys.firstObject;
      NSString *buttonTitle = [button[buttonKey] description];
      UIAlertActionStyle buttonStyle = [buttonKey isEqualToString:@"cancel"] ? UIAlertActionStyleCancel : UIAlertActionStyleDefault;
      [alertController addAction:[UIAlertAction actionWithTitle:buttonTitle
                                                          style:buttonStyle
                                                        handler:^(__unused UIAlertAction *action) {
        if (callback) {
          if ([type isEqual:RCTAlertTypePlainText] || [type isEqual:RCTAlertTypeSecure]) {
            callback(@[buttonKey, alertController.textFields.firstObject.text]);
          } else if ([type isEqual:RCTAlertTypeLoginAndPassword]) {
            NSDictionary *loginCredentials = @{
                                               @"login": alertController.textFields.firstObject.text,
                                               @"password": alertController.textFields.lastObject.text
                                               };
            callback(@[buttonKey, loginCredentials]);
          } else {
            callback(@[buttonKey]);
          }
        }
      }]];
    }

    if (!_alertControllers) {
      _alertControllers = [NSMutableArray new];
    }
    [_alertControllers addObject:alertController];

    [presentingController presentViewController:alertController animated:YES completion:nil];
  }
}

#pragma mark - UIAlertViewDelegate

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
  NSUInteger index = [_alerts indexOfObject:alertView];
  RCTAssert(index != NSNotFound, @"Dismissed alert was not recognised");

  RCTResponseSenderBlock callback = _alertCallbacks[index];
  NSArray<NSString *> *buttonKeys = _alertButtonKeys[index];

  if (alertView.alertViewStyle == UIAlertViewStylePlainTextInput || alertView.alertViewStyle == UIAlertViewStyleSecureTextInput) {
    callback(@[buttonKeys[buttonIndex], [alertView textFieldAtIndex:0].text]);
  } else if (alertView.alertViewStyle == UIAlertViewStyleLoginAndPasswordInput) {
    NSDictionary *loginCredentials = @{
                                       @"login": [alertView textFieldAtIndex:0].text,
                                       @"password": [alertView textFieldAtIndex:1].text,
                                       };
    callback(@[buttonKeys[buttonIndex], loginCredentials]);
  } else {
    callback(@[buttonKeys[buttonIndex]]);
  }

  [_alerts removeObjectAtIndex:index];
  [_alertCallbacks removeObjectAtIndex:index];
  [_alertButtonKeys removeObjectAtIndex:index];
}

@end
