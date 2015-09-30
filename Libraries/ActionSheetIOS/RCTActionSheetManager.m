/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTActionSheetManager.h"

#import "RCTConvert.h"
#import "RCTLog.h"
#import "RCTUtils.h"
#import "RCTBridge.h"
#import "RCTUIManager.h"

@interface RCTActionSheetManager () <UIActionSheetDelegate>

@end

@implementation RCTActionSheetManager
{
  NSMutableDictionary *_callbacks;
}

RCT_EXPORT_MODULE()

- (instancetype)init
{
  if ((self = [super init])) {
    _callbacks = [NSMutableDictionary new];
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

RCT_EXPORT_METHOD(showActionSheetWithOptions:(NSDictionary *)options
                  failureCallback:(__unused RCTResponseSenderBlock)failureCallback
                  successCallback:(RCTResponseSenderBlock)successCallback)
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
  
  UIActionSheet *actionSheet = [UIActionSheet new];

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

  _callbacks[RCTKeyForInstance(actionSheet)] = successCallback;

  UIWindow *appWindow = RCTSharedApplication().delegate.window;
  if (appWindow == nil) {
    RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", options);
    return;
  }
  [actionSheet showInView:appWindow];
}

RCT_EXPORT_METHOD(showShareActionSheetWithOptions:(NSDictionary *)options
                  failureCallback:(RCTResponseSenderBlock)failureCallback
                  successCallback:(RCTResponseSenderBlock)successCallback)
{
  NSMutableArray *items = [NSMutableArray array];
  NSString *message = [RCTConvert NSString:options[@"message"]];
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [RCTConvert NSURL:options[@"url"]];
  if (URL) {
    [items addObject:URL];
  }
  if (items.count == 0) {
    failureCallback(@[@"No `url` or `message` to share"]);
    return;
  }
  if (RCTRunningInAppExtension()) {
    failureCallback(@[@"Unable to show action sheet from app extension"]);
    return;
  }

  UIActivityViewController *share = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];
  UIViewController *ctrl = RCTSharedApplication().delegate.window.rootViewController;

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  if (![UIActivityViewController instancesRespondToSelector:@selector(setCompletionWithItemsHandler:)]) {
    // Legacy iOS 7 implementation
    share.completionHandler = ^(NSString *activityType, BOOL completed) {
      successCallback(@[@(completed), RCTNullIfNil(activityType)]);
    };
  } else

#endif

  {
    // iOS 8 version
    share.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
      if (activityError) {
        failureCallback(@[RCTNullIfNil(activityError.localizedDescription)]);
      } else {
        successCallback(@[@(completed), RCTNullIfNil(activityType)]);
      }
    };
  }

  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  if ([share respondsToSelector:@selector(popoverPresentationController)]) {
    share.popoverPresentationController.sourceView = ctrl.view;
    NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];
    if (anchorViewTag) {
      UIView *anchorView = [self.bridge.uiManager viewForReactTag:anchorViewTag];
      share.popoverPresentationController.sourceRect = [anchorView convertRect:anchorView.bounds toView:ctrl.view];
    } else {
      CGRect sourceRect = CGRectMake(ctrl.view.center.x, ctrl.view.center.y, 1, 1);
      share.popoverPresentationController.sourceRect = sourceRect;
      share.popoverPresentationController.permittedArrowDirections = 0;
    }
  }

  [ctrl presentViewController:share animated:YES completion:nil];
}

#pragma mark UIActionSheetDelegate Methods

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  NSString *key = RCTKeyForInstance(actionSheet);
  RCTResponseSenderBlock callback = _callbacks[key];
  if (callback) {
    callback(@[@(buttonIndex)]);
    [_callbacks removeObjectForKey:key];
  } else {
    RCTLogWarn(@"No callback registered for action sheet: %@", actionSheet.title);
  }

  [RCTSharedApplication().delegate.window makeKeyWindow];
}

#pragma mark Private

static NSString *RCTKeyForInstance(id instance)
{
  return [NSString stringWithFormat:@"%p", instance];
}

@end
