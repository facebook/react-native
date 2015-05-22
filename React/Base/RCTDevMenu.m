/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDevMenu.h"

#import "RCTBridge.h"
#import "RCTDefines.h"
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

- (void)RCT_motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTShowDevMenuNotification object:nil];
  }
}

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

    _defaults = [NSUserDefaults standardUserDefaults];
    _settings = [[NSMutableDictionary alloc] init];

    // Delay setup until after Bridge init
    [self settingsDidChange];

#if TARGET_IPHONE_SIMULATOR

    __weak RCTDevMenu *weakSelf = self;
    RCTKeyCommands *commands = [RCTKeyCommands sharedInstance];

    // Toggle debug menu
    [commands registerKeyCommandWithInput:@"d"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(UIKeyCommand *command) {
                                     [weakSelf toggle];
                                   }];

    // Reload in normal mode
    [commands registerKeyCommandWithInput:@"n"
                            modifierFlags:UIKeyModifierCommand
                                   action:^(UIKeyCommand *command) {
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
  } else if (![sourceCodeModule.scriptURL isFileURL]) {
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

- (BOOL)isValid
{
  return NO;
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

RCT_EXPORT_METHOD(show)
{
  if (_actionSheet || !_bridge) {
    return;
  }

  NSString *debugTitleChrome = _executorClass && _executorClass == NSClassFromString(@"RCTWebSocketExecutor") ? @"Disable Chrome Debugging" : @"Debug in Chrome";
  NSString *debugTitleSafari = _executorClass && _executorClass == NSClassFromString(@"RCTWebViewExecutor") ? @"Disable Safari Debugging" : @"Debug in Safari";
  NSString *fpsMonitor = _showFPS ? @"Hide FPS Monitor" : @"Show FPS Monitor";

  UIActionSheet *actionSheet =
  [[UIActionSheet alloc] initWithTitle:@"React Native: Development"
                              delegate:self
                     cancelButtonTitle:nil
                destructiveButtonTitle:nil
                     otherButtonTitles:@"Reload", debugTitleChrome, debugTitleSafari, fpsMonitor, nil];

  if (_liveReloadURL) {

    NSString *liveReloadTitle = _liveReloadEnabled ? @"Disable Live Reload" : @"Enable Live Reload";
    NSString *profilingTitle  = RCTProfileIsProfiling() ? @"Stop Profiling" : @"Start Profiling";

    [actionSheet addButtonWithTitle:liveReloadTitle];
    [actionSheet addButtonWithTitle:profilingTitle];
  }

  [actionSheet addButtonWithTitle:@"Cancel"];
  actionSheet.cancelButtonIndex = [actionSheet numberOfButtons] - 1;

  actionSheet.actionSheetStyle = UIBarStyleBlack;
  [actionSheet showInView:[UIApplication sharedApplication].keyWindow.rootViewController.view];
  _actionSheet = actionSheet;
}

RCT_EXPORT_METHOD(reload)
{
  _jsLoaded = NO;
  _liveReloadURL = nil;
  [_bridge reload];
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  _actionSheet = nil;
  if (buttonIndex == actionSheet.cancelButtonIndex) {
    return;
  }

  switch (buttonIndex) {
    case 0: {
      [self reload];
      break;
    }
    case 1: {
      Class cls = NSClassFromString(@"RCTWebSocketExecutor");
      if (!cls) {
        [[[UIAlertView alloc] initWithTitle:@"Chrome Debugger Unavailable"
                                    message:@"You need to include the RCTWebSocket library to enable Chrome debugging"
                                   delegate:nil
                          cancelButtonTitle:@"OK"
                          otherButtonTitles:nil] show];
        return;
      }
      self.executorClass = (_executorClass == cls) ? Nil : cls;
      break;
    }
    case 2: {
      Class cls = NSClassFromString(@"RCTWebViewExecutor");
      self.executorClass = (_executorClass == cls) ? Nil : cls;
      break;
    }
    case 3: {
      self.showFPS = !_showFPS;
      break;
    }
    case 4: {
      self.liveReloadEnabled = !_liveReloadEnabled;
      break;
    }
    case 5: {
      self.profilingEnabled = !_profilingEnabled;
      break;
    }
    default:
      break;
  }
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
  _updateTask = [[NSURLSession sharedSession] dataTaskWithURL:_liveReloadURL completionHandler:^(NSData *data, NSURLResponse *response, NSError *error) {

    dispatch_async(dispatch_get_main_queue(), ^{
      __strong RCTDevMenu *strongSelf = weakSelf;
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

@end

#endif

@implementation  RCTBridge (RCTDevMenu)

- (RCTDevMenu *)devMenu
{
  return self.modules[RCTBridgeModuleNameForClass([RCTDevMenu class])];
}

@end
