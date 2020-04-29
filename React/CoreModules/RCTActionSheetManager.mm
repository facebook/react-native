/*
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

<<<<<<< HEAD:Libraries/ActionSheetIOS/RCTActionSheetManager.m
@interface RCTActionSheetManager ()
#if !TARGET_OS_OSX // [TODO(macOS ISS#2323203)
<UIActionSheetDelegate>
#else
<NSSharingServicePickerDelegate>
#endif // ]TODO(macOS ISS#2323203)
=======
#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTActionSheetManager () <UIActionSheetDelegate, NativeActionSheetManagerSpec>
>>>>>>> fb/0.62-stable:React/CoreModules/RCTActionSheetManager.mm
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
#endif // TODO(macOS ISS#2323203)

RCT_EXPORT_METHOD(showActionSheetWithOptions:(JS::NativeActionSheetManager::SpecShowActionSheetWithOptionsOptions &)options
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

<<<<<<< HEAD:Libraries/ActionSheetIOS/RCTActionSheetManager.m
  NSString *title = [RCTConvert NSString:options[@"title"]];
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  NSString *message = [RCTConvert NSString:options[@"message"]];
#endif // TODO(macOS ISS#2323203)
  NSArray<NSString *> *buttons = [RCTConvert NSStringArray:options[@"options"]];
  NSInteger cancelButtonIndex = options[@"cancelButtonIndex"] ? [RCTConvert NSInteger:options[@"cancelButtonIndex"]] : -1;
=======
  NSString *title = options.title();
  NSString *message = options.message();
  NSArray<NSString *> *buttons = RCTConvertOptionalVecToArray(options.options(), ^id(NSString *element) { return element; });
  NSInteger cancelButtonIndex = options.cancelButtonIndex() ? [RCTConvert NSInteger:@(*options.cancelButtonIndex())] : -1;
>>>>>>> fb/0.62-stable:React/CoreModules/RCTActionSheetManager.mm
  NSArray<NSNumber *> *destructiveButtonIndices;
  if (options.destructiveButtonIndices()) {
    destructiveButtonIndices = RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) { return @(element); });
  } else {
<<<<<<< HEAD:Libraries/ActionSheetIOS/RCTActionSheetManager.m
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
    NSNumber *destructiveButtonIndex = options[@"destructiveButtonIndex"] ? [RCTConvert NSNumber:options[@"destructiveButtonIndex"]] : @-1;
=======
    NSNumber *destructiveButtonIndex = @-1;
>>>>>>> fb/0.62-stable:React/CoreModules/RCTActionSheetManager.mm
    destructiveButtonIndices = @[destructiveButtonIndex];
#endif // TODO(macOS ISS#2323203)
  }
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIViewController *controller = RCTPresentedViewController();
  NSNumber *anchor = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  UIColor *tintColor = [RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

  if (controller == nil) {
    RCTLogError(@"Tried to display action sheet but there is no application window. options: %@", @{
                                                                                      @"title": title,
                                                                                    @"message": message,
                                                                                    @"options": buttons,
                                                                          @"cancelButtonIndex": @(cancelButtonIndex),
                                                                   @"destructiveButtonIndices": destructiveButtonIndices,
                                                                                     @"anchor": anchor,
                                                                                  @"tintColor": tintColor,
    });
    return;
  }
#endif // TODO(macOS ISS#2323203)
  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
<<<<<<< HEAD:Libraries/ActionSheetIOS/RCTActionSheetManager.m
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
=======
  NSNumber *anchorViewTag = anchor;

>>>>>>> fb/0.62-stable:React/CoreModules/RCTActionSheetManager.mm
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

  alertController.view.tintColor = tintColor;
  [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];

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
  NSView *superview = [view superview];
  if (event && view) {
    // On a macOS trackpad, soft taps are received as sysDefined event types. SysDefined event locations are relative to the screen so we have to convert those separately.
    NSPoint eventLocationRelativeToWindow = NSZeroPoint;
    CGPoint eventLocationInWindow = [event locationInWindow];
    if ([event type] == NSEventTypeSystemDefined) { // light tap event relative to screen
      eventLocationRelativeToWindow = [[view window] convertRectFromScreen:NSMakeRect(eventLocationInWindow.x, eventLocationInWindow.y, 0, 0)].origin;
    } else { // full click events are relative to the window
      eventLocationRelativeToWindow = eventLocationInWindow;
    }
    origin = [view convertPoint:eventLocationRelativeToWindow fromView:nil];
  } else if (view) {
    CGRect superviewFrame = [superview frame];
    origin = NSMakePoint(NSMidX(superviewFrame), NSMidY(superviewFrame));
  } else {
    origin = [NSEvent mouseLocation];
  }
  
  [menu popUpMenuPositioningItem:menu.itemArray.firstObject atLocation:origin inView:superview];
#endif // ]TODO(macOS ISS#2323203)
}

RCT_EXPORT_METHOD(showShareActionSheetWithOptions:(JS::NativeActionSheetManager::SpecShowShareActionSheetWithOptionsOptions &)options
                  failureCallback:(RCTResponseSenderBlock)failureCallback
                  successCallback:(RCTResponseSenderBlock)successCallback)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
#endif // TODO(macOS ISS#2323203)

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = options.message();
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [RCTConvert NSURL:options.url()];
  if (URL) {
    if ([URL.scheme.lowercaseString isEqualToString:@"data"]) {
      NSError *error;
      NSData *data = [NSData dataWithContentsOfURL:URL
                                           options:(NSDataReadingOptions)0
                                             error:&error];
      if (!data) {
        failureCallback(@[RCTJSErrorFromNSError(error)]);
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

  NSString *subject = options.subject();
  if (subject) {
    [shareController setValue:subject forKey:@"subject"];
  }

  NSArray *excludedActivityTypes = RCTConvertOptionalVecToArray(options.excludedActivityTypes(), ^id(NSString *element) { return element; });
  if (excludedActivityTypes) {
    shareController.excludedActivityTypes = excludedActivityTypes;
  }

  UIViewController *controller = RCTPresentedViewController();
  shareController.completionWithItemsHandler = ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
    if (activityError) {
<<<<<<< HEAD:Libraries/ActionSheetIOS/RCTActionSheetManager.m
      failureCallback(activityError);
    } else if (completed) {
=======
      failureCallback(@[RCTJSErrorFromNSError(activityError)]);
    } else if (completed || activityType == nil) {
>>>>>>> fb/0.62-stable:React/CoreModules/RCTActionSheetManager.mm
      successCallback(@[@(completed), RCTNullIfNil(activityType)]);
    }
  };

<<<<<<< HEAD:Libraries/ActionSheetIOS/RCTActionSheetManager.m
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options[@"anchor"]];
  shareController.view.tintColor = [RCTConvert UIColor:options[@"tintColor"]];
=======
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  shareController.view.tintColor = [RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

>>>>>>> fb/0.62-stable:React/CoreModules/RCTActionSheetManager.mm
  [self presentViewController:shareController onParentViewController:controller anchorViewTag:anchorViewTag];
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

<<<<<<< HEAD:Libraries/ActionSheetIOS/RCTActionSheetManager.m
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
  
=======
- (std::shared_ptr<TurboModule>)getTurboModuleWithJsInvoker:(std::shared_ptr<CallInvoker>)jsInvoker
{
  return std::make_shared<NativeActionSheetManagerSpecJSI>(self, jsInvoker);
}

>>>>>>> fb/0.62-stable:React/CoreModules/RCTActionSheetManager.mm
@end

Class RCTActionSheetManagerCls(void) {
  return RCTActionSheetManager.class;
}
