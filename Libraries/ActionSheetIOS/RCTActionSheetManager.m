/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTActionSheetManager.h"

#import <React/RCTBridge.h>
#import <React/RCTConvert.h>
#import <React/RCTLog.h>
#import <React/RCTUIManager.h>
#import <React/RCTUtils.h>

@interface RCTActionSheetManager ()
#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
<UIActionSheetDelegate>
#else
<NSSharingServicePickerDelegate>
#endif // ]TODO(macOS ISS#2323203)
@end

@implementation RCTActionSheetManager
{
  // Use NSMapTable, as UIAlertViews do not implement <NSCopying>
  // which is required for NSDictionary keys
  NSMapTable *_callbacks;
#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
  NSArray<NSSharingService*> *_excludedActivities;
  NSString *_sharingSubject;
  RCTResponseErrorBlock _failureCallback;
  RCTResponseSenderBlock _successCallback;
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_MODULE()

@synthesize bridge = _bridge;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
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
#endif // TODO(macOS ISS#2323203)

RCT_EXPORT_METHOD(showActionSheetWithOptions:(NSDictionary *)options
                  callback:(RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
#endif // TODO(macOS ISS#2323203)

  if (!_callbacks) {
    _callbacks = [NSMapTable strongToStrongObjectsMapTable];
  }

  NSString *title = [RCTConvert NSString:options[@"title"]];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  NSString *message = [RCTConvert NSString:options[@"message"]];
#endif // TODO(macOS ISS#2323203)
  NSArray<NSString *> *buttons = [RCTConvert NSStringArray:options[@"options"]];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  NSInteger destructiveButtonIndex = options[@"destructiveButtonIndex"] ? [RCTConvert NSInteger:options[@"destructiveButtonIndex"]] : -1;
#endif // TODO(macOS ISS#2323203)
  NSInteger cancelButtonIndex = options[@"cancelButtonIndex"] ? [RCTConvert NSInteger:options[@"cancelButtonIndex"]] : -1;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIViewController *controller = RCTPresentedViewController();

  if (controller == nil) {
    RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", options);
    return;
  }
#endif // TODO(macOS ISS#2323203)
  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIView *sourceView = controller.view;
  CGRect sourceRect = [self sourceRectInView:sourceView anchorViewTag:anchorViewTag];

  UIAlertController *alertController =
  [UIAlertController alertControllerWithTitle:title
                                      message:message
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

  alertController.view.tintColor = [RCTConvert UIColor:options[@"tintColor"]];
#else // [TODO(macOS ISS#2323203)
  NSMenu *menu = [[NSMenu alloc] initWithTitle:title ?: @""];
  [_callbacks setObject:callback forKey:menu];
  for (NSInteger index = 0; index < buttons.count; index++) {
    if (index == cancelButtonIndex) {
      //NSMenu doesn't require a cancel button
      continue;
    }
    
    NSString *option = buttons[index];
    NSMenuItem *item = [[NSMenuItem alloc] initWithTitle:option action:@selector(menuItemDidTap:) keyEquivalent:@""];
    item.tag = index;
    item.target = self;
    [menu addItem:item];
  }
  
  NSPoint origin = NSZeroPoint;
  NSEvent *event = nil;
  RCTPlatformView *view = nil;
  if (anchorViewTag) {
    view = [self.bridge.uiManager viewForReactTag:anchorViewTag];
    event = [view.window currentEvent];
  }
  if (event && view) {
    origin = [view convertPoint:[event locationInWindow] fromView:nil];
  } else if (view) {
    origin = NSMakePoint(NSMidX(view.superview.frame), NSMidY(view.superview.frame));
  } else {
    origin = [NSEvent mouseLocation];
  }
  
  [menu popUpMenuPositioningItem:menu.itemArray.firstObject atLocation:origin inView:view.superview];
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(showShareActionSheetWithOptions:(NSDictionary *)options
                  failureCallback:(RCTResponseErrorBlock)failureCallback
                  successCallback:(RCTResponseSenderBlock)successCallback)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
#endif // TODO(macOS ISS#2323203)

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

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
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

  [controller presentViewController:shareController animated:YES completion:nil];

  shareController.view.tintColor = [RCTConvert UIColor:options[@"tintColor"]];
#else // [TODO(macOS ISS#2323203)
  NSMutableArray<NSSharingService*> *excludedTypes = [NSMutableArray array];
  for (NSString *excludeActivityType in [RCTConvert NSStringArray:options[@"excludedActivityTypes"]]) {
    NSSharingService *sharingService = [NSSharingService sharingServiceNamed:excludeActivityType];
    if (sharingService) {
      [excludedTypes addObject:sharingService];
    }
  }
  _excludedActivities = excludedTypes.copy;
  _sharingSubject = [RCTConvert NSString:options[@"subject"]];
  _failureCallback = failureCallback;
  _successCallback = successCallback;
  RCTPlatformView *view = nil;
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];
  if (anchorViewTag) {
    view = [self.bridge.uiManager viewForReactTag:anchorViewTag];
  }
  NSView *contentView = view ?: NSApp.keyWindow.contentView;
  NSSharingServicePicker *picker = [[NSSharingServicePicker alloc] initWithItems:items];
  picker.delegate = self;
  [picker showRelativeToRect:contentView.bounds ofView:contentView preferredEdge:0];
#endif // ]TODO(macOS ISS#2323203)
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)

#pragma mark - NSSharingServicePickerDelegate methods

- (void)menuItemDidTap:(NSMenuItem*)menuItem
{
  NSMenu *actionSheet = menuItem.menu;
  NSInteger buttonIndex = menuItem.tag;
  RCTResponseSenderBlock callback = [_callbacks objectForKey:actionSheet];
  if (callback) {
    callback(@[@(buttonIndex)]);
    [_callbacks removeObjectForKey:actionSheet];
  } else {
    RCTLogWarn(@"No callback registered for action sheet: %@", actionSheet.title);
  }
}

- (void)sharingServicePicker:(NSSharingServicePicker *)sharingServicePicker didChooseSharingService:(NSSharingService *)service
{
  if (service){
    service.subject = _sharingSubject;
  }
}
  
- (void)sharingService:(NSSharingService *)sharingService didFailToShareItems:(NSArray *)items error:(NSError *)error
{
  _failureCallback(error);
}

- (void)sharingService:(NSSharingService *)sharingService didShareItems:(NSArray *)items
{
  NSRange range = [sharingService.description rangeOfString:@"\\[com.apple.share.*\\]" options:NSRegularExpressionSearch];
  if (range.location == NSNotFound) {
    _successCallback(@[@NO, (id)kCFNull]);
    return;
  }
  range.location++; // Start after [
  range.length -= 2; // Remove both [ and ]
  NSString *activityType = [sharingService.description substringWithRange:range];
  _successCallback(@[@YES, RCTNullIfNil(activityType)]);
}
  
- (NSArray<NSSharingService *> *)sharingServicePicker:(__unused NSSharingServicePicker *)sharingServicePicker sharingServicesForItems:(__unused NSArray *)items proposedSharingServices:(NSArray<NSSharingService *> *)proposedServices
{
  return [proposedServices filteredArrayUsingPredicate:[NSPredicate predicateWithBlock:^BOOL(NSSharingService *service, __unused NSDictionary<NSString *,id> * _Nullable bindings) {
    return ![self->_excludedActivities containsObject:service];
  }]];
}
  
#endif // ]TODO(macOS ISS#2323203)
  
@end
