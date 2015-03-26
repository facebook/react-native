/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTActionSheetManager.h"

#import "RCTLog.h"

@interface RCTActionSheetManager() <UIActionSheetDelegate>

@end

@implementation RCTActionSheetManager {
  NSMutableDictionary *_callbacks;
}

- (instancetype)init
{
  if ((self = [super init])) {
    _callbacks = [[NSMutableDictionary alloc] init];
  }
  return self;
}

- (void)showActionSheetWithOptions:(NSDictionary *)options
                          failureCallback:(RCTResponseSenderBlock)failureCallback
                          successCallback:(RCTResponseSenderBlock)successCallback
{
  RCT_EXPORT();

  dispatch_async(dispatch_get_main_queue(), ^{
    UIActionSheet *actionSheet = [[UIActionSheet alloc] init];

    actionSheet.title = options[@"title"];

    for (NSString *option in options[@"options"]) {
      [actionSheet addButtonWithTitle:option];
    }

    if (options[@"destructiveButtonIndex"]) {
      actionSheet.destructiveButtonIndex = [options[@"destructiveButtonIndex"] integerValue];
    }
    if (options[@"cancelButtonIndex"]) {
      actionSheet.cancelButtonIndex = [options[@"cancelButtonIndex"] integerValue];
    }

    actionSheet.delegate = self;

    _callbacks[keyForInstance(actionSheet)] = successCallback;

    UIWindow *appWindow = [[[UIApplication sharedApplication] delegate] window];
    if (appWindow == nil) {
      RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", options);
      return;
    }
    [actionSheet showInView:appWindow];
  });
}

- (void)showShareActionSheetWithOptions:(NSDictionary *)options
                        failureCallback:(RCTResponseSenderBlock)failureCallback
                        successCallback:(RCTResponseSenderBlock)successCallback
{
  RCT_EXPORT();

  dispatch_async(dispatch_get_main_queue(), ^{
    NSMutableArray *items = [NSMutableArray array];
    id message = options[@"message"];
    id url = options[@"url"];
    if ([message isKindOfClass:[NSString class]]) {
      [items addObject:message];
    }
    if ([url isKindOfClass:[NSString class]]) {
      [items addObject:[NSURL URLWithString:url]];
    }
    if ([items count] == 0) {
      failureCallback(@[@"No `url` or `message` to share"]);
      return;
    }
    UIActivityViewController *share = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];
    UIViewController *ctrl = [[[[UIApplication sharedApplication] delegate] window] rootViewController];
    if ([share respondsToSelector:@selector(setCompletionWithItemsHandler:)]) {
      share.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, NSArray *returnedItems, NSError *activityError) {
        if (activityError) {
          failureCallback(@[[activityError localizedDescription]]);
        } else {
          successCallback(@[@(completed), (activityType ?: [NSNull null])]);
        }
      };
    } else {

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

      if (![UIActivityViewController instancesRespondToSelector:@selector(completionWithItemsHandler)]) {
        // Legacy iOS 7 implementation
        share.completionHandler = ^(NSString *activityType, BOOL completed) {
          successCallback(@[@(completed), (activityType ?: [NSNull null])]);
        };
      } else

#endif

      {
        // iOS 8 version
        share.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, NSArray *returnedItems, NSError *activityError) {
          successCallback(@[@(completed), (activityType ?: [NSNull null])]);
        };
      }
    }
    [ctrl presentViewController:share animated:YES completion:nil];
  });
}

#pragma mark UIActionSheetDelegate Methods

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  NSString *key = keyForInstance(actionSheet);
  RCTResponseSenderBlock callback = _callbacks[key];
  if (callback) {
    callback(@[@(buttonIndex)]);
    [_callbacks removeObjectForKey:key];
  } else {
    RCTLogWarn(@"No callback registered for action sheet: %@", actionSheet.title);
  }

  [[[[UIApplication sharedApplication] delegate] window] makeKeyWindow];
}

#pragma mark Private

static NSString *keyForInstance(id instance)
{
  return [NSString stringWithFormat:@"%p", instance];
}

@end
