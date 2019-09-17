/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <React/RCTActionSheetManager.h>

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

@interface RCTActionSheetManager () <UIActionSheetDelegate>
@end

@implementation RCTActionSheetManager
{
  // Use NSMapTable, as UIAlertViews do not implement <NSCopying>
  // which is required for NSDictionary keys
  NSMapTable *_callbacks;
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)presentViewController:(UIViewController *)alertController
       onParentViewController:(UIViewController *)parentViewController
                anchorViewTag:(NSNumber *)anchorViewTag
{
  alertController.modalPresentationStyle = UIModalPresentationPopover;
  UIView *sourceView = parentViewController.view;

  if (anchorViewTag) {
    sourceView = [self.bridge.uiManager viewForReactTag:anchorViewTag];
  } else {
    alertController.popoverPresentationController.permittedArrowDirections = 0;
  }
  alertController.popoverPresentationController.sourceView = sourceView;
  alertController.popoverPresentationController.sourceRect = sourceView.bounds;
  [parentViewController presentViewController:alertController animated:YES completion:nil];
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
  NSString *message = [RCTConvert NSString:options[@"message"]];
  NSArray<NSString *> *buttons = [RCTConvert NSStringArray:options[@"options"]];
  NSInteger cancelButtonIndex = options[@"cancelButtonIndex"] ? [RCTConvert NSInteger:options[@"cancelButtonIndex"]] : -1;
  NSArray<NSNumber *> *destructiveButtonIndices;
  if ([options[@"destructiveButtonIndex"] isKindOfClass:[NSArray class]]) {
    destructiveButtonIndices = [RCTConvert NSArray:options[@"destructiveButtonIndex"]];
  } else {
    NSNumber *destructiveButtonIndex = options[@"destructiveButtonIndex"] ? [RCTConvert NSNumber:options[@"destructiveButtonIndex"]] : @-1;
    destructiveButtonIndices = @[destructiveButtonIndex];
  }

  UIViewController *controller = RCTPresentedViewController();

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
  
  UIAlertController *alertController =
  [UIAlertController alertControllerWithTitle:title
                                      message:message
                               preferredStyle:UIAlertControllerStyleActionSheet];

  NSInteger index = 0;
  for (NSString *option in buttons) {
    UIAlertActionStyle style = UIAlertActionStyleDefault;
    if ([destructiveButtonIndices containsObject:@(index)]) {
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

  alertController.view.tintColor = [RCTConvert UIColor:options[@"tintColor"]];
  [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];
}

RCT_EXPORT_METHOD(showShareActionSheetWithOptions:(NSDictionary *)options
                  failureCallback:(RCTResponseErrorBlock)failureCallback
                  successCallback:(RCTResponseSenderBlock)successCallback)
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = [RCTConvert NSString:options[@"message"]];
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [RCTConvert NSURL:options[@"url"]];
  if (URL) {
    if ([URL.scheme.lowercaseString isEqualToString:@"data"]) {
      NSError *error;
      NSData *data = [NSData dataWithContentsOfURL:URL
                                           options:(NSDataReadingOptions)0
                                             error:&error];
      if (!data) {
        failureCallback(error);
        return;
      }
      [items addObject:data];
    } else {
      [items addObject:URL];
    }
  }
  if (items.count == 0) {
    RCTLogError(@"No `url` or `message` to share");
    return;
  }

  UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items applicationActivities:nil];

  NSString *subject = [RCTConvert NSString:options[@"subject"]];
  if (subject) {
    [shareController setValue:subject forKey:@"subject"];
  }

  NSArray *excludedActivityTypes = [RCTConvert NSStringArray:options[@"excludedActivityTypes"]];
  if (excludedActivityTypes) {
    shareController.excludedActivityTypes = excludedActivityTypes;
  }

  UIViewController *controller = RCTPresentedViewController();
  shareController.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
    if (activityError) {
      failureCallback(activityError);
    } else if (completed) {
      successCallback(@[@(completed), RCTNullIfNil(activityType)]);
    }
  };

  NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];
  shareController.view.tintColor = [RCTConvert UIColor:options[@"tintColor"]];
  
  [self presentViewController:shareController onParentViewController:controller anchorViewTag:anchorViewTag];
}

@end
