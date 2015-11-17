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
  // Use NSMapTable, as UIAlertViews do not implement <NSCopying>
  // which is required for NSDictionary keys
  NSMapTable *_callbacks;
}

RCT_EXPORT_MODULE()

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

/*
 * The `anchor` option takes a view to set as the anchor for the share
 * popup to point to, on iPads running iOS 8. If it is not passed, it
 * defaults to centering the share popup on screen without any arrows.
 */
- (CGRect)sourceRectInView:(UIView *)sourceView
             anchorViewTag:(NSNumber *)anchorViewTag
{
  if (anchorViewTag) {
    UIView *anchorView = [self.bridge.uiManager viewForReactTag:anchorViewTag];
    return [anchorView convertRect:anchorView.bounds toView:sourceView];
  } else {
    return (CGRect){sourceView.center, {1, 1}};
  }
}

RCT_EXPORT_METHOD(showActionSheetWithOptions:(NSDictionary *)options
                  callback:(RCTResponseSenderBlock)callback)
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  if (!_callbacks) {
    _callbacks = [NSMapTable strongToStrongObjectsMapTable];
  }

  NSString *title = [RCTConvert NSString:options[@"title"]];
  NSArray<NSString *> *buttons = [RCTConvert NSStringArray:options[@"options"]];
  NSInteger destructiveButtonIndex = options[@"destructiveButtonIndex"] ? [RCTConvert NSInteger:options[@"destructiveButtonIndex"]] : -1;
  NSInteger cancelButtonIndex = options[@"cancelButtonIndex"] ? [RCTConvert NSInteger:options[@"cancelButtonIndex"]] : -1;

  UIViewController *controller = RCTKeyWindow().rootViewController;
  if (controller == nil) {
    RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", options);
    return;
  }

  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];
  UIView *sourceView = controller.view;
  CGRect sourceRect = [self sourceRectInView:sourceView anchorViewTag:anchorViewTag];

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  if ([UIAlertController class] == nil) {

    UIActionSheet *actionSheet = [UIActionSheet new];

    actionSheet.title = title;
    for (NSString *option in buttons) {
      [actionSheet addButtonWithTitle:option];
    }
    actionSheet.destructiveButtonIndex = destructiveButtonIndex;
    actionSheet.cancelButtonIndex = cancelButtonIndex;
    actionSheet.delegate = self;

    [_callbacks setObject:callback forKey:actionSheet];

    if (UI_USER_INTERFACE_IDIOM() == UIUserInterfaceIdiomPad) {
      [actionSheet showFromRect:sourceRect inView:sourceView animated:YES];
    } else {
      [actionSheet showInView:sourceView];
    }

  } else

#endif

  {
    UIAlertController *alertController =
    [UIAlertController alertControllerWithTitle:title
                                        message:nil
                                 preferredStyle:UIAlertControllerStyleActionSheet];

    NSInteger index = 0;
    for (NSString *option in buttons) {
      UIAlertActionStyle style = UIAlertActionStyleDefault;
      if (index == destructiveButtonIndex) {
        style = UIAlertActionStyleDestructive;
      } else if (index == cancelButtonIndex) {
        style = UIAlertActionStyleCancel;
      }

      NSInteger localIndex = index;
      [alertController addAction:[UIAlertAction actionWithTitle:option
                                                          style:style
                                                        handler:^(__unused UIAlertAction *action){
        callback(@[@(localIndex)]);
      }]];

      index++;
    }

    alertController.modalPresentationStyle = UIModalPresentationPopover;
    alertController.popoverPresentationController.sourceView = sourceView;
    alertController.popoverPresentationController.sourceRect = sourceRect;
    if (!anchorViewTag) {
      alertController.popoverPresentationController.permittedArrowDirections = 0;
    }
    [controller presentViewController:alertController animated:YES completion:nil];
  }
}

RCT_EXPORT_METHOD(showShareActionSheetWithOptions:(NSDictionary *)options
                  failureCallback:(RCTResponseErrorBlock)failureCallback
                  successCallback:(RCTResponseSenderBlock)successCallback)
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSMutableArray<id /* NSString or NSURL */> *items = [NSMutableArray array];
  NSString *message = [RCTConvert NSString:options[@"message"]];
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [RCTConvert NSURL:options[@"url"]];
  if (URL) {
    [items addObject:URL];
  }
  if (items.count == 0) {
    RCTLogError(@"No `url` or `message` to share");
    return;
  }

  UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];
  UIViewController *controller = RCTKeyWindow().rootViewController;

#if __IPHONE_OS_VERSION_MIN_REQUIRED < __IPHONE_8_0

  if (![UIActivityViewController instancesRespondToSelector:@selector(setCompletionWithItemsHandler:)]) {
    // Legacy iOS 7 implementation
    shareController.completionHandler = ^(NSString *activityType, BOOL completed) {
      successCallback(@[@(completed), RCTNullIfNil(activityType)]);
    };
  } else

#endif

  {
    // iOS 8 version
    shareController.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
      if (activityError) {
        failureCallback(activityError);
      } else {
        successCallback(@[@(completed), RCTNullIfNil(activityType)]);
      }
    };

    shareController.modalPresentationStyle = UIModalPresentationPopover;
    NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];
    if (!anchorViewTag) {
      shareController.popoverPresentationController.permittedArrowDirections = 0;
    }
    shareController.popoverPresentationController.sourceView = controller.view;
    shareController.popoverPresentationController.sourceRect = [self sourceRectInView:controller.view anchorViewTag:anchorViewTag];
  }

  [controller presentViewController:shareController animated:YES completion:nil];
}

#pragma mark UIActionSheetDelegate Methods

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  RCTResponseSenderBlock callback = [_callbacks objectForKey:actionSheet];
  if (callback) {
    callback(@[@(buttonIndex)]);
    [_callbacks removeObjectForKey:actionSheet];
  } else {
    RCTLogWarn(@"No callback registered for action sheet: %@", actionSheet.title);
  }
}

@end
