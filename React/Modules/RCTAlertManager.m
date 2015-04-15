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
#import "RCTLog.h"

@interface RCTAlertManager() <UIAlertViewDelegate>

@end

@implementation RCTAlertManager
{
  NSMutableArray *_alerts;
  NSMutableArray *_alertCallbacks;
  NSMutableArray *_alertButtonKeys;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _alerts = [[NSMutableArray alloc] init];
    _alertCallbacks = [[NSMutableArray alloc] init];
    _alertButtonKeys = [[NSMutableArray alloc] init];
  }
  return self;
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
  NSString *title = args[@"title"];
  NSString *message = args[@"message"];
  NSArray *buttons = args[@"buttons"];

  if (!title && !message) {
    RCTLogError(@"Must specify either an alert title, or message, or both");
    return;
  } else if (buttons.count == 0) {
    RCTLogError(@"Must have at least one button.");
    return;
  }

  dispatch_async(dispatch_get_main_queue(), ^{

    UIAlertView *alertView = [[UIAlertView alloc] initWithTitle:title
                                                        message:message
                                                       delegate:self
                                              cancelButtonTitle:nil
                                              otherButtonTitles:nil];

    NSMutableArray *buttonKeys = [[NSMutableArray alloc] initWithCapacity:buttons.count];

    NSInteger index = 0;
    for (NSDictionary *button in buttons) {
      if (button.count != 1) {
        RCTLogError(@"Button definitions should have exactly one key.");
      }
      NSString *buttonKey = [button.allKeys firstObject];
      NSString *buttonTitle = [button[buttonKey] description];
      [alertView addButtonWithTitle:buttonTitle];
      if ([buttonKey isEqualToString: @"cancel"]) {
        alertView.cancelButtonIndex = index;
      }
      [buttonKeys addObject:buttonKey];
      index ++;
    }

    [_alerts addObject:alertView];
    [_alertCallbacks addObject:callback ?: ^(id unused) {}];
    [_alertButtonKeys addObject:buttonKeys];

    [alertView show];
  });
}

#pragma mark - UIAlertViewDelegate

- (void)alertView:(UIAlertView *)alertView clickedButtonAtIndex:(NSInteger)buttonIndex
{
  NSUInteger index = [_alerts indexOfObject:alertView];
  RCTAssert(index != NSNotFound, @"Dismissed alert was not recognised");

  RCTResponseSenderBlock callback = _alertCallbacks[index];
  NSArray *buttonKeys = _alertButtonKeys[index];
  callback(@[buttonKeys[buttonIndex]]);

  [_alerts removeObjectAtIndex:index];
  [_alertCallbacks removeObjectAtIndex:index];
  [_alertButtonKeys removeObjectAtIndex:index];
}

@end
