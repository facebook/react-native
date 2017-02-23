/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDevMenu.h"

#import "RCTDevSettings.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTUtils.h"

#if RCT_DEV

static NSString *const RCTShowDevMenuNotification = @"RCTShowDevMenuNotification";

@implementation UIWindow (RCTDevMenu)

- (void)RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTShowDevMenuNotification object:nil];
  }
}

@end

typedef NSString *(^RCTDevMenuItemTitleBlock)(void);

@interface RCTDevMenuItem ()

@end

@implementation RCTDevMenuItem
{
  id _handler; // block
  RCTDevMenuItemTitleBlock _getTitleForPresentation;
}

- (instancetype)initWithTitleBlock:(NSString * (^)(void))getTitleForPresentation
                           handler:(id /* block */)handler
{
  if ((self = [super init])) {
    _getTitleForPresentation = [getTitleForPresentation copy];
    _handler = [handler copy];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (instancetype)buttonItemWithTitleBlock:(NSString *(^)(void))getTitleForPresentation handler:(void (^)(void))handler
{
  return [[self alloc] initWithTitleBlock:getTitleForPresentation handler:handler];
}

+ (instancetype)buttonItemWithTitle:(NSString *)title
                            handler:(void (^)(void))handler
{
  return [[self alloc] initWithTitleBlock:^NSString *{ return title; } handler:handler];
}

- (void)callHandler
{
  if (_handler) {
    ((void(^)())_handler)();
  }
}

- (NSString *)title
{
  if (_getTitleForPresentation) {
    return _getTitleForPresentation();
  }
  return nil;
}

@end

typedef void(^RCTDevMenuAlertActionHandler)(UIAlertAction *action);

@interface RCTDevMenu () <RCTBridgeModule, RCTInvalidating>

@end

@implementation RCTDevMenu
{
  UIAlertController *_actionSheet;
  NSMutableArray<RCTDevMenuItem *> *_extraMenuItems;
  NSString *_webSocketExecutorName;
}

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

+ (void)initialize
{
  // We're swizzling here because it's poor form to override methods in a category,
  // however UIWindow doesn't actually implement motionEnded:withEvent:, so there's
  // no need to call the original implementation.
  RCTSwapInstanceMethods([UIWindow class], @selector(motionEnded:withEvent:), @selector(RCT_motionEnded:withEvent:));
}

- (instancetype)init
{
  if ((self = [super init])) {
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:RCTShowDevMenuNotification
                                               object:nil];
    
    _extraMenuItems = [NSMutableArray new];
    __weak RCTDevMenu *weakSelf = self;
    
    [_extraMenuItems addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return (weakSelf.bridge.devSettings.isElementInspectorShown) ? @"Hide Inspector" : @"Show Inspector";
    } handler:^{
      [weakSelf.bridge.devSettings toggleElementInspector];
    }]];
    
    _webSocketExecutorName = _bridge.devSettings.websocketExecutorName ?: @"JS Remotely";
    
#if TARGET_IPHONE_SIMULATOR
    
    RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];
    
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
  [_actionSheet dismissViewControllerAnimated:YES completion:^(void){}];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)showOnShake
{
  if ([_bridge.devSettings isShakeToShowDevMenuEnabled]) {
    [self show];
  }
}

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
  __weak RCTDevMenu *weakSelf = self;
  
  [items addObject:[RCTDevMenuItem buttonItemWithTitle:@"Reload" handler:^{
    [weakSelf.bridge.devSettings reload];
  }]];
  
  if (!_bridge.devSettings.isRemoteDebuggingAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:[NSString stringWithFormat:@"%@ Debugger Unavailable", _webSocketExecutorName] handler:^{
      UIAlertController *alertController = [UIAlertController alertControllerWithTitle:[NSString stringWithFormat:@"%@ Debugger Unavailable", self->_webSocketExecutorName]
                                                                               message:[NSString stringWithFormat:@"You need to include the RCTWebSocket library to enable %@ debugging", self->_webSocketExecutorName]
                                                                        preferredStyle:UIAlertControllerStyleAlert];
      
      [RCTPresentedViewController() presentViewController:alertController animated:YES completion:NULL];
    }]];
  } else {
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return (weakSelf.bridge.devSettings.isDebuggingRemotely) ?
      [NSString stringWithFormat:@"Stop %@ Debugging", weakSelf.bridge.devSettings.websocketExecutorName ?: @"Remote JS"] :
      [NSString stringWithFormat:@"Debug %@", _webSocketExecutorName];
    } handler:^{
      weakSelf.bridge.devSettings.isDebuggingRemotely = !weakSelf.bridge.devSettings.isDebuggingRemotely;
    }]];
  }
  
  if (_bridge.devSettings.isLiveReloadAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return (weakSelf.bridge.devSettings.isLiveReloadEnabled) ? @"Disable Live Reload" : @"Enable Live Reload";
    } handler:^{
      weakSelf.bridge.devSettings.isLiveReloadEnabled = !weakSelf.bridge.devSettings.isLiveReloadEnabled;
    }]];
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return (weakSelf.bridge.devSettings.isProfilingEnabled) ? @"Stop Systrace" : @"Start Systrace";
    } handler:^{
      weakSelf.bridge.devSettings.isProfilingEnabled = !weakSelf.bridge.devSettings.isProfilingEnabled;
    }]];
  }
  
  if (_bridge.devSettings.isHotLoadingAvailable) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitleBlock:^NSString *{
      return (weakSelf.bridge.devSettings.isHotLoadingEnabled) ? @"Disable Hot Reloading" : @"Enable Hot Reloading";
    } handler:^{
      weakSelf.bridge.devSettings.isHotLoadingEnabled = !weakSelf.bridge.devSettings.isHotLoadingEnabled;
    }]];
  }
  
  if (_bridge.devSettings.isJSCSamplingProfilerAvailable) {
    // Note: bridge.jsContext is not implemented in the old bridge, so this code is
    // duplicated in RCTJSCExecutor
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:@"Start / Stop JS Sampling Profiler" handler:^{
      [weakSelf.bridge.devSettings toggleJSCSamplingProfiler];
    }]];
  }
  
  [items addObjectsFromArray:_extraMenuItems];
  
  return items;
}

RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || !_bridge || RCTRunningInAppExtension()) {
    return;
  }
  
  NSString *title = [NSString stringWithFormat:@"React Native: Development (%@)", [_bridge class]];
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
}

- (RCTDevMenuAlertActionHandler)alertActionHandlerForDevItem:(RCTDevMenuItem *__nullable)item
{
  return ^(__unused UIAlertAction *action) {
    if (item) {
      [item callHandler];
    }
    
    self->_actionSheet = nil;
  };
}

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
  [_bridge.devSettings reload];
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
+ (instancetype)buttonItemWithTitleBlock:(NSString * (^)(void))getTitleForPresentation
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
