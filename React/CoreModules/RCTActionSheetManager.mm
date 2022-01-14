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

#import <FBReactNativeSpec/FBReactNativeSpec.h>
#import <RCTTypeSafety/RCTConvertHelpers.h>

#import "CoreModulesPlugins.h"

using namespace facebook::react;

@interface RCTActionSheetManager () <
#if !TARGET_OS_OSX // [TODO(macOS GH#774)
UIActionSheetDelegate
#else
NSSharingServicePickerDelegate
#endif // ]TODO(macOS GH#774)
, NativeActionSheetManagerSpec>
@end

@implementation RCTActionSheetManager {
  // Use NSMapTable, as UIAlertViews do not implement <NSCopying>
  // which is required for NSDictionary keys
  NSMapTable *_callbacks;
#if TARGET_OS_OSX // [TODO(macOS GH#774)
  NSArray<NSSharingService*> *_excludedActivities;
  NSString *_sharingSubject;
  RCTResponseSenderBlock _failureCallback;
  RCTResponseSenderBlock _successCallback;
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_MODULE()

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#if !TARGET_OS_OSX // TODO(macOS GH#774)
- (void)presentViewController:(UIViewController *)alertController
       onParentViewController:(UIViewController *)parentViewController
                anchorViewTag:(NSNumber *)anchorViewTag
{
  alertController.modalPresentationStyle = UIModalPresentationPopover;
  UIView *sourceView = parentViewController.view;

  if (anchorViewTag) {
    sourceView = [self.viewRegistry_DEPRECATED viewForReactTag:anchorViewTag];
  } else {
    alertController.popoverPresentationController.permittedArrowDirections = 0;
  }
  alertController.popoverPresentationController.sourceView = sourceView;
  alertController.popoverPresentationController.sourceRect = sourceView.bounds;
  [parentViewController presentViewController:alertController animated:YES completion:nil];
}
#endif // TODO(macOS GH#774)

RCT_EXPORT_METHOD(showActionSheetWithOptions
                  : (JS::NativeActionSheetManager::SpecShowActionSheetWithOptionsOptions &)options callback
                  : (RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
#endif // TODO(macOS GH#774)

  if (!_callbacks) {
    _callbacks = [NSMapTable strongToStrongObjectsMapTable];
  }

  NSString *title = options.title();
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  NSString *message = options.message();
#endif // TODO(macOS GH#774)
  NSArray<NSString *> *buttons = RCTConvertOptionalVecToArray(options.options(), ^id(NSString *element) {
    return element;
  });
  NSArray<NSNumber *> *disabledButtonIndices;
  NSInteger cancelButtonIndex =
      options.cancelButtonIndex() ? [RCTConvert NSInteger:@(*options.cancelButtonIndex())] : -1;
  NSArray<NSNumber *> *destructiveButtonIndices;
  if (options.disabledButtonIndices()) {
    disabledButtonIndices = RCTConvertVecToArray(*options.disabledButtonIndices(), ^id(double element) {
      return @(element);
    });
  }
  if (options.destructiveButtonIndices()) {
    destructiveButtonIndices = RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) {
      return @(element);
    });
  } else {
#if !TARGET_OS_OSX // TODO(macOS GH#774)
    NSNumber *destructiveButtonIndex = @-1;
    destructiveButtonIndices = @[ destructiveButtonIndex ];
#endif // TODO(macOS GH#774)
  }

  NSNumber *anchor = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UIViewController *controller = RCTPresentedViewController();
  UIColor *tintColor = [RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

  if (controller == nil) {
    RCTLogError(
        @"Tried to display action sheet but there is no application window. options: %@", @{ /*  // [ TODO(macOS GH#774): nil check our dict values before inserting them or we may crash */
          @"title" : title ?: [NSNull null],
          @"message" : message ?: [NSNull null],
          @"options" : buttons ?: [NSNull null],
          @"cancelButtonIndex" : @(cancelButtonIndex),
          @"destructiveButtonIndices" : destructiveButtonIndices ?: [NSNull null],
          @"anchor" : anchor ?: [NSNull null],
          @"tintColor" : tintColor ?: [NSNull null],
          @"disabledButtonIndices" : disabledButtonIndices ?: [NSNull null],
        }); /*  // TODO(macOS GH#774): nil check our dict values before inserting them or we may crash ] */
    return;
  }
#endif // TODO(macOS GH#774)
  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  NSNumber *anchorViewTag = anchor;

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:title
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
                                                      handler:^(__unused UIAlertAction *action) {
                                                        callback(@[ @(localIndex) ]);
                                                      }]];

    index++;
  }

  if (disabledButtonIndices) {
    for (NSNumber *disabledButtonIndex in disabledButtonIndices) {
      if ([disabledButtonIndex integerValue] < buttons.count) {
        [alertController.actions[[disabledButtonIndex integerValue]] setEnabled:false];
      } else {
        RCTLogError(
            @"Index %@ from `disabledButtonIndices` is out of bounds. Maximum index value is %@.",
            @([disabledButtonIndex integerValue]),
            @(buttons.count - 1));
        return;
      }
    }
  }

  alertController.view.tintColor = tintColor;
#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    NSString *userInterfaceStyle = [RCTConvert NSString:options.userInterfaceStyle()];

    if (userInterfaceStyle == nil || [userInterfaceStyle isEqualToString:@""]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    } else if ([userInterfaceStyle isEqualToString:@"dark"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([userInterfaceStyle isEqualToString:@"light"]) {
      alertController.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    }
  }
#endif

  [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];

#else // [TODO(macOS GH#774)
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

  RCTPlatformView *view = nil;
  if (anchorViewTag) {
    view = [self.bridge.uiManager viewForReactTag:anchorViewTag];
  }
  NSPoint location = CGPointZero;
  if (view != nil) {
    // Display under the anchorview
    CGRect bounds = [view bounds];

    CGFloat originX = [view userInterfaceLayoutDirection] == NSUserInterfaceLayoutDirectionRightToLeft ? NSMaxX(bounds) : NSMinX(bounds);
    location = NSMakePoint(originX, NSMaxY(bounds));
  } else {
    // Display at mouse location if no anchorView provided
    location = [NSEvent mouseLocation];
  }
  [menu popUpMenuPositioningItem:menu.itemArray.firstObject atLocation:location inView:view];
#endif // ]TODO(macOS GH#774)
}

RCT_EXPORT_METHOD(showShareActionSheetWithOptions
                  : (JS::NativeActionSheetManager::SpecShowShareActionSheetWithOptionsOptions &)options failureCallback
                  : (RCTResponseSenderBlock)failureCallback successCallback
                  : (RCTResponseSenderBlock)successCallback)
{
#if !TARGET_OS_OSX // TODO(macOS GH#774)
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
#endif // TODO(macOS GH#774)

  NSMutableArray<id> *items = [NSMutableArray array];
  NSString *message = options.message();
  if (message) {
    [items addObject:message];
  }
  NSURL *URL = [RCTConvert NSURL:options.url()];
  if (URL) {
    if ([URL.scheme.lowercaseString isEqualToString:@"data"]) {
      NSError *error;
      NSData *data = [NSData dataWithContentsOfURL:URL options:(NSDataReadingOptions)0 error:&error];
      if (!data) {
        failureCallback(@[ RCTJSErrorFromNSError(error) ]);
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

#if !TARGET_OS_OSX // TODO(macOS GH#774)
  UIActivityViewController *shareController = [[UIActivityViewController alloc] initWithActivityItems:items
                                                                                applicationActivities:nil];

  NSString *subject = options.subject();
  if (subject) {
    [shareController setValue:subject forKey:@"subject"];
  }

  NSArray *excludedActivityTypes =
      RCTConvertOptionalVecToArray(options.excludedActivityTypes(), ^id(NSString *element) {
        return element;
      });
  if (excludedActivityTypes) {
    shareController.excludedActivityTypes = excludedActivityTypes;
  }

  UIViewController *controller = RCTPresentedViewController();
  shareController.completionWithItemsHandler =
      ^(NSString *activityType, BOOL completed, __unused NSArray *returnedItems, NSError *activityError) {
        if (activityError) {
          failureCallback(@[ RCTJSErrorFromNSError(activityError) ]);
        } else if (completed || activityType == nil) {
          successCallback(@[ @(completed), RCTNullIfNil(activityType) ]);
        }
      };

  NSNumber *anchorViewTag = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  shareController.view.tintColor = [RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];

#if defined(__IPHONE_OS_VERSION_MAX_ALLOWED) && defined(__IPHONE_13_0) && \
    __IPHONE_OS_VERSION_MAX_ALLOWED >= __IPHONE_13_0
  if (@available(iOS 13.0, *)) {
    NSString *userInterfaceStyle = [RCTConvert NSString:options.userInterfaceStyle()];

    if (userInterfaceStyle == nil || [userInterfaceStyle isEqualToString:@""]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleUnspecified;
    } else if ([userInterfaceStyle isEqualToString:@"dark"]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleDark;
    } else if ([userInterfaceStyle isEqualToString:@"light"]) {
      shareController.overrideUserInterfaceStyle = UIUserInterfaceStyleLight;
    }
  }
#endif

  [self presentViewController:shareController onParentViewController:controller anchorViewTag:anchorViewTag];
#else // [TODO(macOS GH#774)
  NSArray *excludedActivityTypes = RCTConvertOptionalVecToArray(options.excludedActivityTypes(), ^id(NSString *element) { return element; });
  NSMutableArray<NSSharingService*> *excludedTypes = [NSMutableArray array];
  for (NSString *excludeActivityType in excludedActivityTypes) {
    NSSharingService *sharingService = [NSSharingService sharingServiceNamed:excludeActivityType];
    if (sharingService) {
      [excludedTypes addObject:sharingService];
    }
  }
  _excludedActivities = excludedTypes.copy;
  _sharingSubject = options.subject();
  _failureCallback = failureCallback;
  _successCallback = successCallback;
  RCTPlatformView *view = nil;
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  if (anchorViewTag) {
    view = [self.bridge.uiManager viewForReactTag:anchorViewTag];
  }
  NSView *contentView = view ?: NSApp.keyWindow.contentView;
  NSSharingServicePicker *picker = [[NSSharingServicePicker alloc] initWithItems:items];
  picker.delegate = self;
  [picker showRelativeToRect:contentView.bounds ofView:contentView preferredEdge:NSRectEdgeMinX];
#endif // ]TODO(macOS GH#774)
}

#if TARGET_OS_OSX // [TODO(macOS GH#774)

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
  _failureCallback(@[RCTJSErrorFromNSError(error)]);
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
  
#endif // ]TODO(macOS GH#774)
  
- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeActionSheetManagerSpecJSI>(params);
}

@end

Class RCTActionSheetManagerCls(void)
{
  return RCTActionSheetManager.class;
}
