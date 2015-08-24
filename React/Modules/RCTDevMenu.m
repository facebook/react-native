/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDevMenu.h"

#import "RCTAssert.h"
#import "RCTBridge.h"
#import "RCTDefines.h"
#import "RCTEventDispatcher.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTPerfStats.h"
#import "RCTProfile.h"
#import "RCTRootView.h"
#import "RCTSourceCode.h"
#import "RCTUtils.h"

#if RCT_DEV

@interface RCTBridge (Profiling)

- (void)startProfiling;
- (void)stopProfiling;

@end

static NSString *const RCTShowDevMenuNotification = @"RCTShowDevMenuNotification";
static NSString *const RCTDevMenuSettingsKey = @"RCTDevMenu";

@implementation UIWindow (RCTDevMenu)

- (void)RCT_motionEnded:(__unused UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTShowDevMenuNotification object:nil];
  }
}

@end

@interface RCTDevMenuItem : NSObject

@property (nonatomic, copy) NSString *title;
@property (nonatomic, copy) dispatch_block_t handler;

- (instancetype)initWithTitle:(NSString *)title handler:(dispatch_block_t)handler NS_DESIGNATED_INITIALIZER;

@end

@implementation RCTDevMenuItem

- (instancetype)initWithTitle:(NSString *)title handler:(dispatch_block_t)handler
{
  if ((self = [super init])) {
    _title = [title copy];
    _handler = [handler copy];
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

@end

@interface RCTDevMenu () <RCTBridgeModule, UIActionSheetDelegate>

@property (nonatomic, strong) Class executorClass;

@end

@implementation RCTDevMenu
{
  UIActionSheet *_actionSheet;
  NSUserDefaults *_defaults;
  NSMutableDictionary *_settings;
  NSURLSessionDataTask *_updateTask;
  NSURL *_liveReloadURL;
  BOOL _jsLoaded;
  NSArray *_presentedItems;
  NSMutableArray *_extraMenuItems;
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

    NSNotificationCenter *notificationCenter = [NSNotificationCenter defaultCenter];

    [notificationCenter addObserver:self
                           selector:@selector(showOnShake)
                               name:RCTShowDevMenuNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(settingsDidChange)
                               name:NSUserDefaultsDidChangeNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(jsLoaded:)
                               name:RCTJavaScriptDidLoadNotification
                             object:nil];

    [notificationCenter addObserver:self
                           selector:@selector(jsLoaded:)
                               name:RCTJavaScriptDidFailToLoadNotification
                             object:nil];

    _defaults = [NSUserDefaults standardUserDefaults];
    _settings = [NSMutableDictionary new];
    _extraMenuItems = [NSMutableArray array];

    // Delay setup until after Bridge init
    [self settingsDidChange];

#if TARGET_IPHONE_SIMULATOR

    __weak RCTDevMenu *weakSelf = self;
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
                                     [weakSelf.bridge.eventDispatcher
                                      sendDeviceEventWithName:@"toggleElementInspector"
                                      body:nil];
                                   }];

    // Reload in normal mode
    [commands registerKeyCommandWithInput:@"n"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(__unused UIKeyCommand *command) {
                                     weakSelf.executorClass = Nil;
                                   }];
#endif

  }
  return self;
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)settingsDidChange
{
  // Needed to prevent a race condition when reloading
  __weak RCTDevMenu *weakSelf = self;
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf updateSettings];
  });
}

- (void)updateSettings
{
  NSDictionary *settings = [_defaults objectForKey:RCTDevMenuSettingsKey];
  if ([settings isEqualToDictionary:_settings]) {
    return;
  }

  [_settings setDictionary:settings];
  self.shakeToShow = [_settings[@"shakeToShow"] ?: @YES boolValue];
  self.profilingEnabled = [_settings[@"profilingEnabled"] ?: @NO boolValue];
  self.liveReloadEnabled = [_settings[@"liveReloadEnabled"] ?: @NO boolValue];
  self.showFPS = [_settings[@"showFPS"] ?: @NO boolValue];
  self.executorClass = NSClassFromString(_settings[@"executorClass"]);
}

- (void)jsLoaded:(NSNotification *)notification
{
  if (notification.userInfo[@"bridge"] != _bridge) {
    return;
  }

  _jsLoaded = YES;

  // Check if live reloading is available
  _liveReloadURL = nil;
  RCTSourceCode *sourceCodeModule = _bridge.modules[RCTBridgeModuleNameForClass([RCTSourceCode class])];
  if (!sourceCodeModule.scriptURL) {
    if (!sourceCodeModule) {
      RCTLogWarn(@"RCTSourceCode module not found");
    } else {
      RCTLogWarn(@"RCTSourceCode module scriptURL has not been set");
    }
  } else if (!(sourceCodeModule.scriptURL).fileURL) {
    // Live reloading is disabled when running from bundled JS file
    _liveReloadURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:sourceCodeModule.scriptURL];
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    // Hit these setters again after bridge has finished loading
    self.profilingEnabled = _profilingEnabled;
    self.liveReloadEnabled = _liveReloadEnabled;
    self.executorClass = _executorClass;
  });
}

- (void)dealloc
{
  [_updateTask cancel];
  [_actionSheet dismissWithClickedButtonIndex:_actionSheet.cancelButtonIndex animated:YES];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

- (void)updateSetting:(NSString *)name value:(id)value
{
  id currentValue = _settings[name];
  if (currentValue == value || [currentValue isEqual:value]) {
    return;
  }
  if (value) {
    _settings[name] = value;
  } else {
    [_settings removeObjectForKey:name];
  }
  [_defaults setObject:_settings forKey:RCTDevMenuSettingsKey];
  [_defaults synchronize];
}

- (void)showOnShake
{
  if (_shakeToShow) {
    [self show];
  }
}

- (void)toggle
{
  if (_actionSheet) {
    [_actionSheet dismissWithClickedButtonIndex:_actionSheet.cancelButtonIndex animated:YES];
    _actionSheet = nil;
  } else {
    [self show];
  }
}

- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler
{
  [_extraMenuItems addObject:[[RCTDevMenuItem alloc] initWithTitle:title handler:handler]];
}

- (NSArray *)menuItems
{
  NSMutableArray *items = [NSMutableArray array];

  [items addObject:[[RCTDevMenuItem alloc] initWithTitle:@"Reload" handler:^{
    [self reload];
  }]];

  Class chromeExecutorClass = NSClassFromString(@"RCTWebSocketExecutor");
  if (!chromeExecutorClass) {
    [items addObject:[[RCTDevMenuItem alloc] initWithTitle:@"Chrome Debugger Unavailable" handler:^{
      [[[UIAlertView alloc] initWithTitle:@"Chrome Debugger Unavailable"
                                  message:@"You need to include the RCTWebSocket library to enable Chrome debugging"
                                 delegate:nil
                        cancelButtonTitle:@"OK"
                        otherButtonTitles:nil] show];
    }]];
  } else {
    BOOL isDebuggingInChrome = _executorClass && _executorClass == chromeExecutorClass;
    NSString *debugTitleChrome = isDebuggingInChrome ? @"Disable Chrome Debugging" : @"Debug in Chrome";
    [items addObject:[[RCTDevMenuItem alloc] initWithTitle:debugTitleChrome handler:^{
      self.executorClass = isDebuggingInChrome ? Nil : chromeExecutorClass;
    }]];
  }

  Class safariExecutorClass = NSClassFromString(@"RCTWebViewExecutor");
  BOOL isDebuggingInSafari = _executorClass && _executorClass == safariExecutorClass;
  NSString *debugTitleSafari = isDebuggingInSafari ? @"Disable Safari Debugging" : @"Debug in Safari";
  [items addObject:[[RCTDevMenuItem alloc] initWithTitle:debugTitleSafari handler:^{
    self.executorClass = isDebuggingInSafari ? Nil : safariExecutorClass;
  }]];

  NSString *fpsMonitor = _showFPS ? @"Hide FPS Monitor" : @"Show FPS Monitor";
  [items addObject:[[RCTDevMenuItem alloc] initWithTitle:fpsMonitor handler:^{
    self.showFPS = !_showFPS;
  }]];

  [items addObject:[[RCTDevMenuItem alloc] initWithTitle:@"Inspect Element" handler:^{
    [_bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
  }]];

  if (_liveReloadURL) {
    NSString *liveReloadTitle = _liveReloadEnabled ? @"Disable Live Reload" : @"Enable Live Reload";
    [items addObject:[[RCTDevMenuItem alloc] initWithTitle:liveReloadTitle handler:^{
      self.liveReloadEnabled = !_liveReloadEnabled;
    }]];

    NSString *profilingTitle  = RCTProfileIsProfiling() ? @"Stop Profiling" : @"Start Profiling";
    [items addObject:[[RCTDevMenuItem alloc] initWithTitle:profilingTitle handler:^{
      self.profilingEnabled = !_profilingEnabled;
    }]];
  }

  [items addObjectsFromArray:_extraMenuItems];

  return items;
}

RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || !_bridge) {
    return;
  }

  UIActionSheet *actionSheet = [UIActionSheet new];
  actionSheet.title = @"React Native: Development";
  actionSheet.delegate = self;

  NSArray *items = [self menuItems];
  for (RCTDevMenuItem *item in items) {
    [actionSheet addButtonWithTitle:item.title];
  }

  [actionSheet addButtonWithTitle:@"Cancel"];
  actionSheet.cancelButtonIndex = actionSheet.numberOfButtons - 1;

  actionSheet.actionSheetStyle = UIBarStyleBlack;
  [actionSheet showInView:[UIApplication sharedApplication].keyWindow.rootViewController.view];
  _actionSheet = actionSheet;
  _presentedItems = items;
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  _actionSheet = nil;
  if (buttonIndex == actionSheet.cancelButtonIndex) {
    return;
  }

  RCTDevMenuItem *item = _presentedItems[buttonIndex];
  item.handler();
  return;
}

RCT_EXPORT_METHOD(reload)
{
  _jsLoaded = NO;
  _liveReloadURL = nil;
  [_bridge reload];
}

- (void)setShakeToShow:(BOOL)shakeToShow
{
  if (_shakeToShow != shakeToShow) {
    _shakeToShow = shakeToShow;
    [self updateSetting:@"shakeToShow" value: @(_shakeToShow)];
  }
}

- (void)setProfilingEnabled:(BOOL)enabled
{
  if (_profilingEnabled != enabled) {
    _profilingEnabled = enabled;
    [self updateSetting:@"profilingEnabled" value: @(_profilingEnabled)];
  }

  if (_liveReloadURL && enabled != RCTProfileIsProfiling()) {
    if (enabled) {
      [_bridge startProfiling];
    } else {
      [_bridge stopProfiling];
    }
  }
}

- (void)setLiveReloadEnabled:(BOOL)enabled
{
  if (_liveReloadEnabled != enabled) {
    _liveReloadEnabled = enabled;
    [self updateSetting:@"liveReloadEnabled" value: @(_liveReloadEnabled)];
  }

  if (_liveReloadEnabled) {
    [self checkForUpdates];
  } else {
    [_updateTask cancel];
    _updateTask = nil;
  }
}

- (void)setExecutorClass:(Class)executorClass
{
  if (_executorClass != executorClass) {
    _executorClass = executorClass;
    [self updateSetting:@"executorClass" value: NSStringFromClass(executorClass)];
  }

  if (_bridge.executorClass != executorClass) {

    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil &&
        (_bridge.executorClass != NSClassFromString(@"RCTWebSocketExecutor") &&
         _bridge.executorClass != NSClassFromString(@"RCTWebViewExecutor"))) {
          return;
        }

    _bridge.executorClass = executorClass;
    [self reload];
  }
}

- (void)setShowFPS:(BOOL)showFPS
{
  if (_showFPS != showFPS) {
    _showFPS = showFPS;

    if (showFPS) {
      [_bridge.perfStats show];
    } else {
      [_bridge.perfStats hide];
    }

    [self updateSetting:@"showFPS" value:@(showFPS)];
  }
}

- (void)checkForUpdates
{
  if (!_jsLoaded || !_liveReloadEnabled || !_liveReloadURL) {
    return;
  }

  if (_updateTask) {
    [_updateTask cancel];
    _updateTask = nil;
    return;
  }

  __weak RCTDevMenu *weakSelf = self;
  _updateTask = [[NSURLSession sharedSession] dataTaskWithURL:_liveReloadURL completionHandler:
                 ^(__unused NSData *data, NSURLResponse *response, NSError *error) {

    dispatch_async(dispatch_get_main_queue(), ^{
      RCTDevMenu *strongSelf = weakSelf;
      if (strongSelf && strongSelf->_liveReloadEnabled) {
        NSHTTPURLResponse *HTTPResponse = (NSHTTPURLResponse *)response;
        if (!error && HTTPResponse.statusCode == 205) {
          [strongSelf reload];
        } else {
          strongSelf->_updateTask = nil;
          [strongSelf checkForUpdates];
        }
      }
    });

  }];

  [_updateTask resume];
}

@end

#else // Unavailable when not in dev mode

@implementation RCTDevMenu

- (void)show {}
- (void)reload {}
- (void)addItem:(NSString *)title handler:(dispatch_block_t)handler {}

@end

#endif

@implementation  RCTBridge (RCTDevMenu)

- (RCTDevMenu *)devMenu
{
  return self.modules[RCTBridgeModuleNameForClass([RCTDevMenu class])];
}

@end
