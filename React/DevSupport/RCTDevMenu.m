/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDevMenu.h"

#import "RCTBridge+Private.h"
#import "RCTDevSettings.h"
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
#import "RCTKeyCommands.h"
#endif // TODO(macOS ISS#2323203)
#import "RCTLog.h"
#import "RCTUtils.h"

#if RCT_DEV

#if RCT_ENABLE_INSPECTOR
#import "RCTInspectorDevServerHelper.h"
#endif

NSString *const RCTShowDevMenuNotification = @"RCTShowDevMenuNotification";

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)

// [TODO(OSS Candidate ISS#2710739)
typedef void (*MotionEndedWithEventImpType)(id self, SEL selector, UIEventSubtype motion, UIEvent *event);
static MotionEndedWithEventImpType RCTOriginalUIWindowMotionEndedWithEventImp = nil;
// ]TODO(OSS Candidate ISS#2710739)

@implementation UIWindow (RCTDevMenu)

- (void)RCT_motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
  RCTOriginalUIWindowMotionEndedWithEventImp(self, @selector(motionEnded:withEvent:), motion, event); // TODO(OSS Candidate ISS#2710739)
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTShowDevMenuNotification object:nil];
  }
}

@end

#endif // TODO(macOS ISS#2323203)

@implementation RCTDevMenuItem
{
  RCTDevMenuItemTitleBlock _titleBlock;
  dispatch_block_t _handler;
}

- (instancetype)initWithTitleBlock:(RCTDevMenuItemTitleBlock)titleBlock
                           handler:(dispatch_block_t)handler
{
  if ((self = [super init])) {
    _titleBlock = [titleBlock copy];
    _handler = [handler copy];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (instancetype)buttonItemWithTitleBlock:(NSString *(^)(void))titleBlock handler:(dispatch_block_t)handler
{
  return [[self alloc] initWithTitleBlock:titleBlock handler:handler];
}

+ (instancetype)buttonItemWithTitle:(NSString *)title
                            handler:(dispatch_block_t)handler
{
  return [[self alloc] initWithTitleBlock:^NSString *{ return title; } handler:handler];
}

- (void)callHandler
{
  if (_handler) {
    _handler();
  }
}

- (NSString *)title
{
  if (_titleBlock) {
    return _titleBlock();
  }
  return nil;
}

@end

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)

typedef void(^RCTDevMenuAlertActionHandler)(UIAlertAction *action);

#endif // TODO(macOS ISS#2323203)

@interface RCTDevMenu () <RCTBridgeModule, RCTInvalidating>

@end

@implementation RCTDevMenu
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  UIAlertController *_actionSheet;
#endif // TODO(macOS ISS#2323203)
  NSMutableArray<RCTDevMenuItem *> *_extraMenuItems;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (void)initialize
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  // We're swizzling here because it's poor form to override methods in a category,
  RCTOriginalUIWindowMotionEndedWithEventImp = (MotionEndedWithEventImpType) RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(RCT_motionEnded:withEvent:)); // TODO(OSS Candidate ISS#2710739)
#endif // TODO(macOS ISS#2323203)
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:RCTShowDevMenuNotification
                                               object:nil];
    _extraMenuItems = [NSMutableArray new];

#if TARGET_OS_SIMULATOR
    RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];
    __weak __typeof(self) weakSelf = self;

    // Toggle debug menu
    [commands registerKeyCommandWithInput:@"d"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf toggle];
                                   }];

    // Toggle element inspector
    [commands registerKeyCommandWithInput:@"i"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf.bridge.devSettings toggleElementInspector];
                                   }];

    // Reload in normal mode
    [commands registerKeyCommandWithInput:@"n"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     [weakSelf.bridge.devSettings setIsDebuggingRemotely:NO];
                                   }];
#endif
  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)invalidate
{
  _presentedItems = nil;
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  [_actionSheet dismissViewControllerAnimated:YES completion:^(void){}];
#endif // TODO(macOS ISS#2323203)
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)showOnShake
{
  RCTDevSettings *devSettings = _bridge.devSettings; // TODO(OSS Candidate ISS#2710739)
  if ([devSettings isDevModeEnabled] &&
      [devSettings isShakeToShowDevMenuEnabled]) {
    [self show];
  }
}

#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
- (void)toggle
{
  if (_actionSheet) {
    [_actionSheet dismissViewControllerAnimated:YES completion:^(void){}];
    _actionSheet = nil;
  } else {
    [self show];
  }
}

- (BOOL)isActionSheetShown
{
  return _actionSheet != nil;
}
#endif // TODO(macOS ISS#2323203)

- (void)addItem:(NSString *)title handler:(void(^)(void))handler
{
  [self addItem:[RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];
}

- (NSArray<RCTDevMenuItem *> *)_menuItemsToPresent
{
  NSMutableArray<RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items
  __weak RCTBridge *bridge = _bridge;
  __weak RCTDevSettings *devSettings = _bridge.devSettings;

  [items addObject:[RCTDevMenuItem buttonItemWithTitle:@"Reload" handler:^{
    [bridge reload];
  }]];

  if (devSettings.isNuclideDebuggingAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:[NSString stringWithFormat:@"Debug JS in Nuclide %@", @"\U0001F4AF"] handler:^{
#if RCT_ENABLE_INSPECTOR
// [TODO(macOS ISS#2323203)
      UIViewController *viewController =
#if !TARGET_OS_OSX
        RCTPresentedViewController();
#else
        nil;
#endif // ]TODO(macOS ISS#2323203)
      [RCTInspectorDevServerHelper attachDebugger:@"ReactNative" withBundleURL:bridge.bundleURL withView:viewController];
#endif
    }]];
  }

  if (!devSettings.isRemoteDebuggingAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:@"Remote JS Debugger Unavailable" handler:^{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
      UIAlertController *alertController = [UIAlertController
        alertControllerWithTitle:@"Remote JS Debugger Unavailable"
        message:@"You need to include the RCTWebSocket library to enable remote JS debugging"
        preferredStyle:UIAlertControllerStyleAlert];
      __weak typeof(alertController) weakAlertController = alertController;
      [alertController addAction:
       [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action){
        [weakAlertController dismissViewControllerAnimated:YES completion:nil];
      }]];
      [RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
#else // [TODO(macOS ISS#2323203)
      NSAlert *alert = [[NSAlert alloc] init];
      [alert setMessageText:@"Remote JS Debugger Unavailable"];
      [alert setInformativeText:@"You need to include the RCTWebSocket library to enable remote JS debugging"];
      [alert addButtonWithTitle:@"OK"];
      [alert setAlertStyle:NSWarningAlertStyle];
      [alert beginSheetModalForWindow:[NSApp keyWindow] completionHandler:nil];
#endif // ]TODO(macOS ISS#2323203)
    }]];
  } else {
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      NSString *title = devSettings.isDebuggingRemotely ? @"Stop Remote JS Debugging" : @"Debug JS Remotely";
      if (devSettings.isNuclideDebuggingAvailable) {
        return [NSString stringWithFormat:@"%@ %@", title, @"\U0001F645"];
      } else {
        return title;
      }
    } handler:^{
      devSettings.isDebuggingRemotely = !devSettings.isDebuggingRemotely;
    }]];
  }

  if (devSettings.isLiveReloadAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return devSettings.isLiveReloadEnabled ? @"Disable Live Reload" : @"Enable Live Reload";
    } handler:^{
      devSettings.isLiveReloadEnabled = !devSettings.isLiveReloadEnabled;
    }]];
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return devSettings.isProfilingEnabled ? @"Stop Systrace" : @"Start Systrace";
    } handler:^{
      if (devSettings.isDebuggingRemotely) {
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
        UIAlertController *alertController = [UIAlertController
          alertControllerWithTitle:@"Systrace Unavailable"
          message:@"You need to stop remote JS debugging to enable Systrace"
          preferredStyle:UIAlertControllerStyleAlert];
        __weak typeof(alertController) weakAlertController = alertController;
        [alertController addAction:
         [UIAlertAction actionWithTitle:@"OK" style:UIAlertActionStyleDefault handler:^(UIAlertAction *action){
          [weakAlertController dismissViewControllerAnimated:YES completion:nil];
        }]];
        [RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
#else // [TODO(macOS ISS#2323203)
        NSAlert *alert = [[NSAlert alloc] init];
        [alert setMessageText:@"Systrace Unavailable"];
        [alert setInformativeText:@"You need to stop remote JS debugging to enable Systrace"];
        [alert addButtonWithTitle:@"OK"];
        [alert setAlertStyle:NSWarningAlertStyle];
        [alert beginSheetModalForWindow:[NSApp keyWindow] completionHandler:nil];
#endif // ]TODO(macOS ISS#2323203)
      } else {
        devSettings.isProfilingEnabled = !devSettings.isProfilingEnabled;
      }
    }]];
  }

  if (_bridge.devSettings.isHotLoadingAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return devSettings.isHotLoadingEnabled ? @"Disable Hot Reloading" : @"Enable Hot Reloading";
    } handler:^{
      devSettings.isHotLoadingEnabled = !devSettings.isHotLoadingEnabled;
    }]];
  }

  if (devSettings.isJSCSamplingProfilerAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:@"Start / Stop JS Sampling Profiler" handler:^{
      [devSettings toggleJSCSamplingProfiler];
    }]];
  }

  [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
    return @"Toggle Inspector";
  } handler:^{
    [devSettings toggleElementInspector];
  }]];

  [items addObjectsFromArray:_extraMenuItems];
  return items;
}

RCT_EXPORT_METHOD(show)
{
#if !TARGET_OS_OSX // TODO(macOS ISS#2323203)
  if (_actionSheet || !_bridge || RCTRunningInAppExtension()) {
    return;
  }

  NSString *desc = _bridge.bridgeDescription;
  if (desc.length == 0) {
    desc = NSStringFromClass([_bridge class]);
  }
  NSString *title = [NSString stringWithFormat:@"React Native: Development (%@)", desc];
  // On larger devices we don't have an anchor point for the action sheet
  UIAlertControllerStyle style = [[UIDevice currentDevice] userInterfaceIdiom] == UIUserInterfaceIdiomPhone ? UIAlertControllerStyleActionSheet : UIAlertControllerStyleAlert;
  _actionSheet = [UIAlertController alertControllerWithTitle:title
                                                     message:@""
                                              preferredStyle:style];

  NSArray<RCTDevMenuItem *> *items = [self _menuItemsToPresent];
  for (RCTDevMenuItem *item in items) {
    [_actionSheet addAction:[UIAlertAction actionWithTitle:item.title
                                                     style:UIAlertActionStyleDefault
                                                   handler:[self alertActionHandlerForDevItem:item]]];
  }

  [_actionSheet addAction:[UIAlertAction actionWithTitle:@"Cancel"
                                                   style:UIAlertActionStyleCancel
                                                 handler:[self alertActionHandlerForDevItem:nil]]];

  _presentedItems = items;
  [RCTPresentedViewController() presentViewController:_actionSheet animated:YES completion:nil];
#else // [TODO(macOS ISS#2323203)
  NSMenu *menu = [self menu];
  NSWindow *window = [NSApp keyWindow];
  NSEvent *event = [NSEvent mouseEventWithType:NSLeftMouseUp location:CGPointMake(0, 0) modifierFlags:0 timestamp:NSTimeIntervalSince1970 windowNumber:[window windowNumber]  context:nil eventNumber:0 clickCount:0 pressure:0.1];
  [NSMenu popUpContextMenu:menu withEvent:event forView:[window contentView]];
#endif // ]TODO(macOS ISS#2323203)
}

#if TARGET_OS_OSX // [TODO(macOS ISS#2323203)
- (NSMenu *)menu
{
  NSMenu *menu = nil;
  if (_bridge) {
    NSString *desc = _bridge.bridgeDescription;
    if (desc.length == 0) {
      desc = NSStringFromClass([_bridge class]);
    }
    NSString *title = [NSString stringWithFormat:@"React Native: Development\n(%@)", desc];

    menu = [[NSMenu alloc] init];

    NSMutableAttributedString *attributedTitle = [[NSMutableAttributedString alloc]initWithString:title];
    [attributedTitle setAttributes: @{ NSFontAttributeName : [NSFont menuFontOfSize:0] } range: NSMakeRange(0, [attributedTitle length])];
    NSMenuItem *titleItem = [[NSMenuItem alloc] init];
    [titleItem setAttributedTitle:attributedTitle];
    [menu addItem:titleItem];

    [menu addItem:[NSMenuItem separatorItem]];

    NSArray<RCTDevMenuItem *> *items = [self _menuItemsToPresent];
    for (RCTDevMenuItem *item in items) {
      NSMenuItem *menuItem = [[NSMenuItem alloc] initWithTitle:[item title] action:@selector(menuItemSelected:) keyEquivalent:@""];
      [menuItem setTarget:self];
      [menuItem setRepresentedObject:item];
      [menu addItem:menuItem];
    }
  }
  return menu;
}

-(void)menuItemSelected:(id)sender
{
  NSMenuItem *menuItem = (NSMenuItem *)sender;
  RCTDevMenuItem *item = (RCTDevMenuItem *)[menuItem representedObject];
  [item callHandler];
}

#else // ]TODO(macOS ISS#2323203)

- (RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(RCTDevMenuItem *__nullable)item
{
  return ^(__unused UIAlertAction *action) {
    if (item) {
      [item callHandler];
    }

    self->_actionSheet = nil;
  };
}
#endif // TODO(macOS ISS#2323203)

#pragma mark - deprecated methods and properties

#define WARN_DEPRECATED_DEV_MENU_EXPORT() RCTLogWarn(@"Using deprecated method %s, use RCTDevSettings instead", __func__)

- (void)setShakeToShow:(BOOL)shakeToShow
{
  _bridge.devSettings.isShakeToShowDevMenuEnabled = shakeToShow;
}

- (BOOL)shakeToShow
{
  return _bridge.devSettings.isShakeToShowDevMenuEnabled;
}

RCT_EXPORT_METHOD(reload)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  [_bridge reload];
}

RCT_EXPORT_METHOD(debugRemotely:(BOOL)enableDebug)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isDebuggingRemotely = enableDebug;
}

RCT_EXPORT_METHOD(setProfilingEnabled:(BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isProfilingEnabled = enabled;
}

- (BOOL)profilingEnabled
{
  return _bridge.devSettings.isProfilingEnabled;
}

RCT_EXPORT_METHOD(setLiveReloadEnabled:(BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isLiveReloadEnabled = enabled;
}

- (BOOL)liveReloadEnabled
{
  return _bridge.devSettings.isLiveReloadEnabled;
}

RCT_EXPORT_METHOD(setHotLoadingEnabled:(BOOL)enabled)
{
  WARN_DEPRECATED_DEV_MENU_EXPORT();
  _bridge.devSettings.isHotLoadingEnabled = enabled;
}

- (BOOL)hotLoadingEnabled
{
  return _bridge.devSettings.isHotLoadingEnabled;
}

@end

#else // Unavailable when not in dev mode

@implementation RCTDevMenu

- (void)show {}
- (void)reload {}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler {}
- (void)addItem:(RCTDevMenu *)item {}
- (BOOL)isActionSheetShown { return NO; }

@end

@implementation RCTDevMenuItem

+ (instancetype)buttonItemWithTitle:(NSString *)title handler:(void(^)(void))handler {return nil;}
+ (instancetype)buttonItemWithTitleBlock:(NSString * (^)(void))titleBlock
                                 handler:(void(^)(void))handler {return nil;}

@end

#endif

@implementation  RCTBridge (RCTDevMenu)

- (RCTDevMenu *)devMenu
{
#if RCT_DEV
  return [self moduleForClass:[RCTDevMenu class]];
#else
  return nil;
#endif
}

@end
