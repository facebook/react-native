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
#import "RCTBridge+Private.h"
#import "RCTDefines.h"
#import "RCTEventDispatcher.h"
#import "RCTKeyCommands.h"
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTRootView.h"
#import "RCTSourceCode.h"
#import "RCTUtils.h"
#import "RCTWebSocketProxy.h"

#if RCT_DEV

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

typedef NS_ENUM(NSInteger, RCTDevMenuType) {
  RCTDevMenuTypeButton,
  RCTDevMenuTypeToggle
};

@interface RCTDevMenuItem ()

@property (nonatomic, assign, readonly) RCTDevMenuType type;
@property (nonatomic, copy, readonly) NSString *key;
@property (nonatomic, copy, readonly) NSString *title;
@property (nonatomic, copy, readonly) NSString *selectedTitle;
@property (nonatomic, copy) id value;

@end

@implementation RCTDevMenuItem
{
  id _handler; // block
}

- (instancetype)initWithType:(RCTDevMenuType)type
                         key:(NSString *)key
                       title:(NSString *)title
               selectedTitle:(NSString *)selectedTitle
                     handler:(id /* block */)handler
{
  if ((self = [super init])) {
    _type = type;
    _key = [key copy];
    _title = [title copy];
    _selectedTitle = [selectedTitle copy];
    _handler = [handler copy];
    _value = nil;
  }
  return self;
}

RCT_NOT_IMPLEMENTED(- (instancetype)init)

+ (instancetype)buttonItemWithTitle:(NSString *)title
                            handler:(void (^)(void))handler
{
  return [[self alloc] initWithType:RCTDevMenuTypeButton
                                key:nil
                              title:title
                      selectedTitle:nil
                            handler:handler];
}

+ (instancetype)toggleItemWithKey:(NSString *)key
                            title:(NSString *)title
                    selectedTitle:(NSString *)selectedTitle
                          handler:(void (^)(BOOL selected))handler
{
  return [[self alloc] initWithType:RCTDevMenuTypeToggle
                                key:key
                              title:title
                      selectedTitle:selectedTitle
                            handler:handler];
}

- (void)callHandler
{
  switch (_type) {
    case RCTDevMenuTypeButton: {
      if (_handler) {
        ((void(^)())_handler)();
      }
      break;
    }
    case RCTDevMenuTypeToggle: {
      if (_handler) {
        ((void(^)(BOOL selected))_handler)([_value boolValue]);
      }
      break;
    }
  }
}

@end

@interface RCTDevMenu () <RCTBridgeModule, UIActionSheetDelegate, RCTInvalidating, RCTWebSocketProxyDelegate>

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
  NSArray<RCTDevMenuItem *> *_presentedItems;
  NSMutableArray<RCTDevMenuItem *> *_extraMenuItems;
  NSString *_webSocketExecutorName;
  NSString *_executorOverride;
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
    _settings = [[NSMutableDictionary alloc] initWithDictionary:[_defaults objectForKey:RCTDevMenuSettingsKey]];
    _extraMenuItems = [NSMutableArray new];

    __weak RCTDevMenu *weakSelf = self;

    [_extraMenuItems addObject:[RCTDevMenuItem toggleItemWithKey:@"showInspector"
                                                 title:@"Show Inspector"
                                         selectedTitle:@"Hide Inspector"
                                               handler:^(__unused BOOL enabled)
    {
      [weakSelf.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
    }]];

    _webSocketExecutorName = [_defaults objectForKey:@"websocket-executor-name"] ?: @"Chrome";

    static dispatch_once_t onceToken;
    dispatch_once(&onceToken, ^{
      _executorOverride = [_defaults objectForKey:@"executor-override"];
    });

    // Delay setup until after Bridge init
    dispatch_async(dispatch_get_main_queue(), ^{
      [weakSelf updateSettings:_settings];
      [weakSelf connectPackager];
    });

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

- (NSURL *)packagerURL
{
  NSString *host = [_bridge.bundleURL host];
  if (!host) {
    return nil;
  }

  NSString *scheme = [_bridge.bundleURL scheme];
  NSNumber *port = [_bridge.bundleURL port];
  if (!port) {
    port = @8081; // Packager default port
  }
  return [NSURL URLWithString:[NSString stringWithFormat:@"%@://%@:%@/message?role=shell", scheme, host, port]];
}

// TODO: Move non-UI logic into separate RCTDevSettings module
- (void)connectPackager
{
  Class webSocketManagerClass = NSClassFromString(@"RCTWebSocketManager");
  id<RCTWebSocketProxy> webSocketManager = (id <RCTWebSocketProxy>)[webSocketManagerClass sharedInstance];
  NSURL *url = [self packagerURL];
  if (url) {
    [webSocketManager setDelegate:self forURL:url];
  }
}

- (BOOL)isSupportedVersion:(NSNumber *)version
{
  NSArray<NSNumber *> *const kSupportedVersions = @[ @1 ];
  return [kSupportedVersions containsObject:version];
}

- (void)socketProxy:(__unused id<RCTWebSocketProxy>)sender didReceiveMessage:(NSDictionary<NSString *, id> *)message
{
  if ([self isSupportedVersion:message[@"version"]]) {
    [self processTarget:message[@"target"] action:message[@"action"] options:message[@"options"]];
  }
}

- (void)processTarget:(NSString *)target action:(NSString *)action options:(NSDictionary<NSString *, id> *)options
{
  if ([target isEqualToString:@"bridge"]) {
    if ([action isEqualToString:@"reload"]) {
      if ([options[@"debug"] boolValue]) {
        _bridge.executorClass = NSClassFromString(@"RCTWebSocketExecutor");
      }
      [_bridge reload];
    }
  }
}

- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

- (void)settingsDidChange
{
  // Needed to prevent a race condition when reloading
  __weak RCTDevMenu *weakSelf = self;
  NSDictionary *settings = [_defaults objectForKey:RCTDevMenuSettingsKey];
  dispatch_async(dispatch_get_main_queue(), ^{
    [weakSelf updateSettings:settings];
  });
}

/**
 * This method loads the settings from NSUserDefaults and overrides any local
 * settings with them. It should only be called on app launch, or after the app
 * has returned from the background, when the settings might have been edited
 * outside of the app.
 */
- (void)updateSettings:(NSDictionary *)settings
{
  [_settings setDictionary:settings];

  // Fire handlers for items whose values have changed
  for (RCTDevMenuItem *item in _extraMenuItems) {
    if (item.key) {
      id value = settings[item.key];
      if (value != item.value && ![value isEqual:item.value]) {
        item.value = value;
        [item callHandler];
      }
    }
  }

  self.shakeToShow = [_settings[@"shakeToShow"] ?: @YES boolValue];
  self.profilingEnabled = [_settings[@"profilingEnabled"] ?: @NO boolValue];
  self.liveReloadEnabled = [_settings[@"liveReloadEnabled"] ?: @NO boolValue];
  self.hotLoadingEnabled = [_settings[@"hotLoadingEnabled"] ?: @NO boolValue];
  self.showFPS = [_settings[@"showFPS"] ?: @NO boolValue];
  self.executorClass = NSClassFromString(_executorOverride ?: _settings[@"executorClass"]);
}

/**
 * This updates a particular setting, and then saves the settings. Because all
 * settings are overwritten by this, it's important that this is not called
 * before settings have been loaded initially, otherwise the other settings
 * will be reset.
 */
- (void)updateSetting:(NSString *)name value:(id)value
{
  // Fire handler for item whose values has changed
  for (RCTDevMenuItem *item in _extraMenuItems) {
    if ([item.key isEqualToString:name]) {
      if (value != item.value && ![value isEqual:item.value]) {
        item.value = value;
        [item callHandler];
      }
      break;
    }
  }

  // Save the setting
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

- (void)jsLoaded:(NSNotification *)notification
{
  if (notification.userInfo[@"bridge"] != _bridge) {
    return;
  }

  _jsLoaded = YES;

  // Check if live reloading is available
  _liveReloadURL = nil;
  RCTSourceCode *sourceCodeModule = [_bridge moduleForClass:[RCTSourceCode class]];
  if (!sourceCodeModule.scriptURL) {
    if (!sourceCodeModule) {
      RCTLogWarn(@"RCTSourceCode module not found");
    } else if (!RCTRunningInTestEnvironment()) {
      RCTLogWarn(@"RCTSourceCode module scriptURL has not been set");
    }
  } else if (!sourceCodeModule.scriptURL.fileURL) {
    // Live reloading is disabled when running from bundled JS file
    _liveReloadURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:sourceCodeModule.scriptURL];
  }

  dispatch_async(dispatch_get_main_queue(), ^{
    // Hit these setters again after bridge has finished loading
    self.profilingEnabled = _profilingEnabled;
    self.liveReloadEnabled = _liveReloadEnabled;
    self.executorClass = _executorClass;

    // Inspector can only be shown after JS has loaded
    if ([_settings[@"showInspector"] boolValue]) {
      [self.bridge.eventDispatcher sendDeviceEventWithName:@"toggleElementInspector" body:nil];
    }
  });
}

- (void)invalidate
{
  _presentedItems = nil;
  [_updateTask cancel];
  [_actionSheet dismissWithClickedButtonIndex:_actionSheet.cancelButtonIndex animated:YES];
  [[NSNotificationCenter defaultCenter] removeObserver:self];
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

- (void)addItem:(NSString *)title handler:(void(^)(void))handler
{
  [self addItem:[RCTDevMenuItem buttonItemWithTitle:title handler:handler]];
}

- (void)addItem:(RCTDevMenuItem *)item
{
  [_extraMenuItems addObject:item];

  // Fire handler for items whose saved value doesn't match the default
  [self settingsDidChange];
}

- (NSArray<RCTDevMenuItem *> *)menuItems
{
  NSMutableArray<RCTDevMenuItem *> *items = [NSMutableArray new];

  // Add built-in items

  __weak RCTDevMenu *weakSelf = self;

  [items addObject:[RCTDevMenuItem buttonItemWithTitle:@"Reload" handler:^{
    [weakSelf reload];
  }]];

  Class chromeExecutorClass = NSClassFromString(@"RCTWebSocketExecutor");
  if (!chromeExecutorClass) {
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:[NSString stringWithFormat:@"%@ Debugger Unavailable", _webSocketExecutorName] handler:^{
      UIAlertView *alert = RCTAlertView(
        [NSString stringWithFormat:@"%@ Debugger Unavailable", _webSocketExecutorName],
        [NSString stringWithFormat:@"You need to include the RCTWebSocket library to enable %@ debugging", _webSocketExecutorName],
        nil,
        @"OK",
        nil);
      [alert show];
    }]];
  } else {
    BOOL isDebuggingInChrome = _executorClass && _executorClass == chromeExecutorClass;
    NSString *debugTitleChrome = isDebuggingInChrome ? [NSString stringWithFormat:@"Disable %@ Debugging", _webSocketExecutorName] : [NSString stringWithFormat:@"Debug in %@", _webSocketExecutorName];
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:debugTitleChrome handler:^{
      weakSelf.executorClass = isDebuggingInChrome ? Nil : chromeExecutorClass;
    }]];
  }

  if (_liveReloadURL) {
    NSString *liveReloadTitle = _liveReloadEnabled ? @"Disable Live Reload" : @"Enable Live Reload";
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:liveReloadTitle handler:^{
      weakSelf.liveReloadEnabled = !_liveReloadEnabled;
    }]];

    NSString *profilingTitle  = RCTProfileIsProfiling() ? @"Stop Systrace" : @"Start Systrace";
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:profilingTitle handler:^{
      weakSelf.profilingEnabled = !_profilingEnabled;
    }]];
  }

  if ([self hotLoadingAvailable]) {
    NSString *hotLoadingTitle = _hotLoadingEnabled ? @"Disable Hot Reloading" : @"Enable Hot Reloading";
    [items addObject:[RCTDevMenuItem buttonItemWithTitle:hotLoadingTitle handler:^{
      weakSelf.hotLoadingEnabled = !_hotLoadingEnabled;
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

  UIActionSheet *actionSheet = [UIActionSheet new];
  actionSheet.title = @"React Native: Development";
  actionSheet.delegate = self;

  NSArray<RCTDevMenuItem *> *items = [self menuItems];
  for (RCTDevMenuItem *item in items) {
    switch (item.type) {
      case RCTDevMenuTypeButton: {
        [actionSheet addButtonWithTitle:item.title];
        break;
      }
      case RCTDevMenuTypeToggle: {
        BOOL selected = [item.value boolValue];
        [actionSheet addButtonWithTitle:selected? item.selectedTitle : item.title];
        break;
      }
    }
  }

  [actionSheet addButtonWithTitle:@"Cancel"];
  actionSheet.cancelButtonIndex = actionSheet.numberOfButtons - 1;

  actionSheet.actionSheetStyle = UIBarStyleBlack;
  [actionSheet showInView:RCTKeyWindow().rootViewController.view];
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
  switch (item.type) {
    case RCTDevMenuTypeButton: {
      [item callHandler];
      break;
    }
    case RCTDevMenuTypeToggle: {
      BOOL value = [_settings[item.key] boolValue];
      [self updateSetting:item.key value:@(!value)]; // will call handler
      break;
    }
  }
  return;
}

RCT_EXPORT_METHOD(reload)
{
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTReloadNotification
                                                      object:nil
                                                    userInfo:nil];
}

- (void)setShakeToShow:(BOOL)shakeToShow
{
  _shakeToShow = shakeToShow;
  [self updateSetting:@"shakeToShow" value:@(_shakeToShow)];
}

- (void)setProfilingEnabled:(BOOL)enabled
{
  _profilingEnabled = enabled;
  [self updateSetting:@"profilingEnabled" value:@(_profilingEnabled)];

  if (_liveReloadURL && enabled != RCTProfileIsProfiling()) {
    if (enabled) {
      [_bridge startProfiling];
    } else {
      [_bridge stopProfiling:^(NSData *logData) {
        RCTProfileSendResult(_bridge, @"systrace", logData);
      }];
    }
  }
}

- (void)setLiveReloadEnabled:(BOOL)enabled
{
  _liveReloadEnabled = enabled;
  [self updateSetting:@"liveReloadEnabled" value:@(_liveReloadEnabled)];

  if (_liveReloadEnabled) {
    [self checkForUpdates];
  } else {
    [_updateTask cancel];
    _updateTask = nil;
  }
}

- (BOOL)hotLoadingAvailable
{
  return _bridge.bundleURL && !_bridge.bundleURL.fileURL; // Only works when running from server
}

- (void)setHotLoadingEnabled:(BOOL)enabled
{
  _hotLoadingEnabled = enabled;
  [self updateSetting:@"hotLoadingEnabled" value:@(_hotLoadingEnabled)];

  BOOL actuallyEnabled = [self hotLoadingAvailable] && _hotLoadingEnabled;
  if (RCTGetURLQueryParam(_bridge.bundleURL, @"hot").boolValue != actuallyEnabled) {
    _bridge.bundleURL = RCTURLByReplacingQueryParam(_bridge.bundleURL, @"hot",
                                                    actuallyEnabled ? @"true" : nil);
    [_bridge reload];
  }
}

- (void)setExecutorClass:(Class)executorClass
{
  if (_executorClass != executorClass) {
    _executorClass = executorClass;
    _executorOverride = nil;
    [self updateSetting:@"executorClass" value:NSStringFromClass(executorClass)];
  }

  if (_bridge.executorClass != executorClass) {

    // TODO (6929129): we can remove this special case test once we have better
    // support for custom executors in the dev menu. But right now this is
    // needed to prevent overriding a custom executor with the default if a
    // custom executor has been set directly on the bridge
    if (executorClass == Nil &&
        _bridge.executorClass != NSClassFromString(@"RCTWebSocketExecutor")) {
      return;
    }

    _bridge.executorClass = executorClass;
    [_bridge reload];
  }
}

- (void)setShowFPS:(BOOL)showFPS
{
  _showFPS = showFPS;
  [self updateSetting:@"showFPS" value:@(showFPS)];
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
- (void)addItem:(RCTDevMenu *)item {}

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
