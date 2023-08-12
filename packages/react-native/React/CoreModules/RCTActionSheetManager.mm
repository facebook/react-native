/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
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
#if !TARGET_OS_OSX // [macOS]
UIActionSheetDelegate
#else // [macOS
NSSharingServicePickerDelegate
#endif // macOS]
, NativeActionSheetManagerSpec>

#if !TARGET_OS_OSX // [macOS] Unlike iOS, we will only ever have one NSMenu present at a time
@property (nonatomic, strong) NSMutableArray<UIAlertController *> *alertControllers;
#endif // [macOS]

@end

@implementation RCTActionSheetManager
#if TARGET_OS_OSX // [macOS
{
  /* Unlike UIAlertAction (which takes a block for it's action), NSMenuItem takes a selector.
   * That selector no longer has has access to the method argument `callback`, so we must save it
   * as an instance variable, that we can access in `menuItemDidTap`. We must do this as well for 
   * `failureCallback` and `successCallback`.
   */
  NSMapTable *_callbacks;
  RCTResponseSenderBlock _failureCallback;
  RCTResponseSenderBlock _successCallback;
  NSArray<NSSharingService*> *_excludedActivities;
  NSString *_sharingSubject;

}
#endif // macOS]

- (instancetype)init
{
  self = [super init];
  if (self) {
#if !TARGET_OS_OSX // [macOS]
    _alertControllers = [NSMutableArray new];
#else // [macOS
    _callbacks = [NSMapTable new];
#endif // macOS]

  }
  return self;
}

+ (BOOL)requiresMainQueueSetup
{
  return NO;
}

RCT_EXPORT_MODULE()

@synthesize viewRegistry_DEPRECATED = _viewRegistry_DEPRECATED;

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
- (void)presentMenu:(NSMenu *)menu
      anchorViewTag:(NSNumber *)anchorViewTag
{
    NSView *sourceView = nil;
    if (anchorViewTag) {
      sourceView = [self.viewRegistry_DEPRECATED viewForReactTag:anchorViewTag];
    }

    NSPoint location = CGPointZero;
    if (sourceView != nil) {
      // Display under the anchorview
      CGRect bounds = [sourceView bounds];

      CGFloat originX = [sourceView userInterfaceLayoutDirection] == NSUserInterfaceLayoutDirectionRightToLeft ? NSMaxX(bounds) : NSMinX(bounds);
      location = NSMakePoint(originX, NSMaxY(bounds));
    } else {
      // Display at mouse location if no anchorView provided
      location = [NSEvent mouseLocation];
    }
    [menu popUpMenuPositioningItem:menu.itemArray.firstObject atLocation:location inView:sourceView];
}
#endif // [macOS]

RCT_EXPORT_METHOD(showActionSheetWithOptions
                  : (JS::NativeActionSheetManager::SpecShowActionSheetWithOptionsOptions &)options callback
                  : (RCTResponseSenderBlock)callback)
{
#if !TARGET_OS_OSX // [macOS]
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
#endif // [macOS]

  NSString *title = options.title();
#if !TARGET_OS_OSX // [macOS] Unused on macOS
  NSString *message = options.message();
#endif // [macOS]
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
#if !TARGET_OS_OSX // [macOS] NSMenu doesn't have an equivalent of destructive buttons
  if (options.destructiveButtonIndices()) {
    destructiveButtonIndices = RCTConvertVecToArray(*options.destructiveButtonIndices(), ^id(double element) {
      return @(element);
    });
  } else {
    NSNumber *destructiveButtonIndex = @-1;
    destructiveButtonIndices = @[ destructiveButtonIndex ];
  }

  UIViewController *controller = RCTPresentedViewController();
#endif // [macOS]
  NSNumber *anchor = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
#if !TARGET_OS_OSX // [macOS]
  UIColor *tintColor = [RCTConvert UIColor:options.tintColor() ? @(*options.tintColor()) : nil];
  UIColor *cancelButtonTintColor =
      [RCTConvert UIColor:options.cancelButtonTintColor() ? @(*options.cancelButtonTintColor()) : nil];

  if (controller == nil) {
    // [macOS nil check our dict values before inserting them or we may crash
    RCTLogError(
        @"Tried to display action sheet but there is no application window. options: %@", @{
          @"title" : title ?: [NSNull null],
          @"message" : message ?: [NSNull null],
          @"options" : buttons ?: [NSNull null],
          @"cancelButtonIndex" : @(cancelButtonIndex),
          @"destructiveButtonIndices" : destructiveButtonIndices ?: [NSNull null],
          @"anchor" : anchor ?: [NSNull null],
          @"tintColor" : tintColor ?: [NSNull null],
          @"cancelButtonTintColor" : cancelButtonTintColor ?: [NSNull null],
          @"disabledButtonIndices" : disabledButtonIndices ?: [NSNull null],
        });
    // macOS]
    return;
  }
#endif // [macOS]

  /*
   * The `anchor` option takes a view to set as the anchor for the share
   * popup to point to, on iPads running iOS 8. If it is not passed, it
   * defaults to centering the share popup on screen without any arrows.
   */
  NSNumber *anchorViewTag = anchor;

#if !TARGET_OS_OSX // [macOS]
  UIAlertController *alertController = [UIAlertController alertControllerWithTitle:title
                                                                           message:message
                                                                    preferredStyle:UIAlertControllerStyleActionSheet];
#else // [macOS
  NSMenu *menu = [[NSMenu alloc] initWithTitle:title ?: @""];
  [menu setAutoenablesItems:NO];
  [_callbacks setObject:callback forKey:menu];
#endif // macOS]

  NSInteger index = 0;
#if !TARGET_OS_OSX // [macOS]
  bool isCancelButtonIndex = false;
  // The handler for a button might get called more than once when tapping outside
  // the action sheet on iPad. RCTResponseSenderBlock can only be called once so
  // keep track of callback invocation here.
  __block bool callbackInvoked = false;
#endif  // [macOS]
  for (NSString *option in buttons) {
#if !TARGET_OS_OSX // [macOS]
    UIAlertActionStyle style = UIAlertActionStyleDefault;
    if ([destructiveButtonIndices containsObject:@(index)]) {
      style = UIAlertActionStyleDestructive;
    } else if (index == cancelButtonIndex) {
      style = UIAlertActionStyleCancel;
      isCancelButtonIndex = true;
    }

    NSInteger localIndex = index;
    UIAlertAction *actionButton = [UIAlertAction actionWithTitle:option
                                                           style:style
                                                         handler:^(__unused UIAlertAction *action) {
                                                           if (!callbackInvoked) {
                                                             callbackInvoked = true;
                                                             [self->_alertControllers removeObject:alertController];
                                                             callback(@[ @(localIndex) ]);
                                                           }
                                                         }];
    if (isCancelButtonIndex) {
      [actionButton setValue:cancelButtonTintColor forKey:@"titleTextColor"];
    }
    [alertController addAction:actionButton];
#else // [macOS
    if (index == cancelButtonIndex) {
      // NSMenu doesn't need a cancel button, you can just click outside the menu
      continue;
    }

    NSMenuItem *item = [[NSMenuItem alloc] initWithTitle:option action:@selector(menuItemDidTap:) keyEquivalent:@""];
    [item setTag:index];
    [item setTarget:self];
    [menu addItem:item];
#endif // macOS]

    index++;
  }

  if (disabledButtonIndices) {
    for (NSNumber *disabledButtonIndex in disabledButtonIndices) {
      if ([disabledButtonIndex integerValue] < buttons.count) {
#if !TARGET_OS_OSX // [macOS]
        [alertController.actions[[disabledButtonIndex integerValue]] setEnabled:false];
#else // [macOS
        NSMenuItem *menuItem = [[menu itemArray] objectAtIndex:[disabledButtonIndex integerValue]];
        [menuItem setEnabled:NO];
#endif // macOS]
      } else {
        RCTLogError(
            @"Index %@ from `disabledButtonIndices` is out of bounds. Maximum index value is %@.",
            @([disabledButtonIndex integerValue]),
            @(buttons.count - 1));
        return;
      }
    }
  }

#if !TARGET_OS_OSX // [macOS]
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

  [_alertControllers addObject:alertController];
  [self presentViewController:alertController onParentViewController:controller anchorViewTag:anchorViewTag];
#else // [macOS
  [self presentMenu:menu anchorViewTag:anchorViewTag];
#endif // macOS]
}

RCT_EXPORT_METHOD(dismissActionSheet)
{
#if !TARGET_OS_OSX // [macOS]
  if (_alertControllers.count == 0) {
    RCTLogWarn(@"Unable to dismiss action sheet");
  }

  id _alertController = [_alertControllers lastObject];
  [_alertController dismissViewControllerAnimated:YES completion:nil];
  [_alertControllers removeLastObject];
#endif // [macOS]
}

RCT_EXPORT_METHOD(showShareActionSheetWithOptions
                  : (JS::NativeActionSheetManager::SpecShowShareActionSheetWithOptionsOptions &)options failureCallback
                  : (RCTResponseSenderBlock)failureCallback successCallback
                  : (RCTResponseSenderBlock)successCallback)
{
#if !TARGET_OS_OSX // [macOS]
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to show action sheet from app extension");
    return;
  }
#endif // [macOS]

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

#if !TARGET_OS_OSX // [macOS]
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
#else // [macOS
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
  RCTPlatformView *sourceView = nil;
  NSNumber *anchorViewTag = [RCTConvert NSNumber:options.anchor() ? @(*options.anchor()) : nil];
  if (anchorViewTag) {
    sourceView = [self.viewRegistry_DEPRECATED viewForReactTag:anchorViewTag];
  }
  NSView *contentView = sourceView ?: NSApp.keyWindow.contentView;
  NSSharingServicePicker *picker = [[NSSharingServicePicker alloc] initWithItems:items];
  picker.delegate = self;
  [picker showRelativeToRect:contentView.bounds ofView:contentView preferredEdge:NSRectEdgeMinX];
#endif // macOS]
}

#if TARGET_OS_OSX // [macOS

#pragma mark - NSSharingServicePickerDelegate methods

- (void)menuItemDidTap:(NSMenuItem*)menuItem
{
  NSMenu *menu = menuItem.menu;
  NSInteger buttonIndex = menuItem.tag;
  RCTResponseSenderBlock callback = [_callbacks objectForKey:menu];
  if (callback) {
    callback(@[@(buttonIndex)]);
    [_callbacks removeObjectForKey:menu];
  } else {
    RCTLogWarn(@"No callback registered for menu: %@", menu.title);
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
#endif // macOS]
  
- (std::shared_ptr<TurboModule>)getTurboModule:(const ObjCTurboModule::InitParams &)params
{
  return std::make_shared<NativeActionSheetManagerSpecJSI>(params);
}

@end

Class RCTActionSheetManagerCls(void)
{
  return RCTActionSheetManager.class;
}
