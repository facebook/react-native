/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTAlertManager.h"

#import "RCTAssert.h"
#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTConvert (UIAlertViewStyle)

RCT_ENUM_CONVERTER(RCTAlertViewStyle, (@{
  @"default": @(RCTAlertViewStyleDefault),
  @"secure-text": @(RCTAlertViewStyleSecureTextInput),
  @"plain-text": @(RCTAlertViewStylePlainTextInput),
  @"login-password": @(RCTAlertViewStyleLoginAndPasswordInput),
}), RCTAlertViewStyleDefault, integerValue)

@end

@interface RCTAlertManager()

@end

@implementation RCTAlertManager
{
  NSHashTable *_alertControllers;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  for (UIAlertController *alertController in _alertControllers) {
    [alertController.presentingViewController dismissViewControllerAnimated:YES completion:nil];
  }
#else // [TODO(macOS ISS#2323203)
  for (NSAlert *alert in _alertControllers) {
    if (alert.window.sheetParent) {
      [alert.window.sheetParent endSheet:alert.window];
    } else {
      [alert.window close];
    }
  }
#endif // ]TODO(macOS ISS#2323203)
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
  RCTAlertViewStyle type = [RCTConvert RCTAlertViewStyle:args[@"type"]];
  NSArray<NSDictionary *> *buttons = [RCTConvert NSDictionaryArray:args[@"buttons"]];
	
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  NSString *defaultValue = [RCTConvert NSString:args[@"defaultValue"]];
  NSString *cancelButtonKey = [RCTConvert NSString:args[@"cancelButtonKey"]];
  NSString *destructiveButtonKey = [RCTConvert NSString:args[@"destructiveButtonKey"]];
  UIKeyboardType keyboardType = [RCTConvert UIKeyboardType:args[@"keyboardType"]];
#else // [TODO(macOS ISS#2323203)
  BOOL critical = [RCTConvert BOOL:args[@"critical"]];
  BOOL modal = [RCTConvert BOOL:args[@"modal"]];
  NSArray<NSDictionary *> *defaultInputs = [RCTConvert NSDictionaryArray:args[@"defaultInputs"]];
#endif // ]TODO(macOS ISS#2323203)

  if (!title && !message) {
    RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  }
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (buttons.count == 0) {
    if (type == RCTAlertViewStyleDefault) {
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
    __weak UIAlertController *weakAlertController = alertController;
    [alertController addAction:[UIAlertAction actionWithTitle:buttonTitle
                                                        style:buttonStyle
                                                      handler:^(__unused UIAlertAction *action) {
      switch (type) {
        case RCTAlertViewStylePlainTextInput:
        case RCTAlertViewStyleSecureTextInput:
          callback(@[buttonKey, [weakAlertController.textFields.firstObject text]]);
          break;
        case RCTAlertViewStyleLoginAndPasswordInput: {
          NSDictionary<NSString *, NSString *> *loginCredentials = @{
            @"login": [weakAlertController.textFields.firstObject text],
            @"password": [weakAlertController.textFields.lastObject text]
          };
          callback(@[buttonKey, loginCredentials]);
          break;
        }
        case RCTAlertViewStyleDefault:
          callback(@[buttonKey]);
          break;
      }
    }]];
  }

  if (!_alertControllers) {
    _alertControllers = [NSHashTable weakObjectsHashTable];
  }
  [_alertControllers addObject:alertController];

  [presentingController presentViewController:alertController animated:YES completion:nil];
#else // [TODO(macOS ISS#2323203)
  
  NSAlert *alert = [[NSAlert alloc] init];
  if (title.length > 0) {
    alert.messageText = title;
  }
  if (message.length > 0) {
    alert.informativeText = message;
  }
  
  if (critical) {
    alert.alertStyle = NSAlertStyleCritical;
  }
  
  NSView *accessoryView = nil;
	
	const NSRect RCTSingleTextFieldFrame = NSMakeRect(0.0, 0.0, 200.0, 22.0);
	const NSRect RCTUsernamePasswordFrame = NSMakeRect(0.0, 0.0, 200.0, 50.0);
	
	id (^textFieldDefaults)(NSTextField *, BOOL) = ^id(NSTextField *textField, BOOL isPassword) {
		textField.cell.scrollable = YES;
		textField.cell.wraps = YES;
		if (@available(macOS 10.11, *)) {
			textField.maximumNumberOfLines = 1;
		}
		textField.stringValue = (isPassword ? defaultInputs.lastObject[@"default"] : defaultInputs.firstObject[@"default"]) ?: @"";
		textField.placeholderString = isPassword ? defaultInputs.lastObject[@"placeholder"] : defaultInputs.firstObject[@"placeholder"];
		return textField;
	};
	
  switch (type) {
    case RCTAlertViewStylePlainTextInput: {
      accessoryView = textFieldDefaults([[NSTextField alloc] initWithFrame:RCTSingleTextFieldFrame], NO);
      accessoryView.translatesAutoresizingMaskIntoConstraints = YES;
      break;
    }
    case RCTAlertViewStyleSecureTextInput: {
      accessoryView = textFieldDefaults([[NSSecureTextField alloc] initWithFrame:RCTSingleTextFieldFrame], NO);
      break;
    }
    case RCTAlertViewStyleLoginAndPasswordInput: {
      accessoryView = [[NSView alloc] initWithFrame:RCTUsernamePasswordFrame];
      
      NSSecureTextField *password = textFieldDefaults([[NSSecureTextField alloc] initWithFrame:RCTSingleTextFieldFrame], YES);
      NSTextField *input = textFieldDefaults([[NSTextField alloc] initWithFrame:NSMakeRect(CGRectGetMinX(password.frame), CGRectGetMaxY(password.frame), CGRectGetWidth(password.frame), CGRectGetHeight(password.frame))], NO);
			
      [accessoryView addSubview:input];
      [accessoryView addSubview:password];
			
      break;
    }
    case RCTAlertViewStyleDefault:
      break;
  }
  alert.accessoryView = accessoryView;
  
  for (NSDictionary<NSString *, id> *button in buttons) {
    if (button.count != 1) {
      RCTLogError(@"Button definitions should have exactly one key.");
    }
    NSString *buttonKey = button.allKeys.firstObject;
    NSString *buttonTitle = [RCTConvert NSString:button[buttonKey]];
    [alert addButtonWithTitle:buttonTitle];
  }
  
  void (^callbacksHandlers)(NSModalResponse response) = ^void(NSModalResponse response) {
    
    if (response >= NSAlertFirstButtonReturn) {
      NSString *buttonKey = buttons[response - NSAlertFirstButtonReturn].allKeys.firstObject;
      NSArray<NSTextField*> *textfields = [accessoryView isKindOfClass:NSTextField.class] ? @[accessoryView] : accessoryView.subviews;
      if (textfields.count == 2) {
        NSDictionary<NSString *, NSString *> *loginCredentials = @{
                                                                   @"login": textfields.firstObject.stringValue,
                                                                   @"password": textfields.lastObject.stringValue
                                                                   };
        callback(@[buttonKey, loginCredentials]);
      } else if (textfields.count == 1) {
        callback(@[buttonKey, textfields.firstObject.stringValue]);
      } else {
        callback(@[buttonKey]);
      }
    }
  };
  
  if (!_alertControllers) {
    _alertControllers = [NSHashTable weakObjectsHashTable];
  }
  [_alertControllers addObject:alert];
  
  if (modal) {
    callbacksHandlers([alert runModal]);
  } else {
    [alert beginSheetModalForWindow:[NSApp keyWindow] completionHandler:callbacksHandlers];
  }
#endif // ]TODO(macOS ISS#2323203)
}

@end
