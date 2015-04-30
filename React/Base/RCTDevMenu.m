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
#import "RCTLog.h"
#import "RCTProfile.h"
#import "RCTRootView.h"
#import "RCTSourceCode.h"
#import "RCTUtils.h"

@interface RCTBridge (Profiling)

- (void)startProfiling;
- (void)stopProfiling;

@end

static NSString *const RCTShowDevMenuNotification = @"RCTShowDevMenuNotification";

@implementation UIWindow (RCTDevMenu)

- (void)RCT_motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (event.subtype == UIEventSubtypeMotionShake) {
    [[NSNotificationCenter defaultCenter] postNotificationName:RCTShowDevMenuNotification object:nil];
  }
}

@end

@implementation RCTDevMenuConfiguration

@synthesize liveReloadPeriod;
@synthesize liveReloadEnabled;

static RCTDevMenuConfiguration *sharedObject;
+ (RCTDevMenuConfiguration *)sharedInstance
{
  if (sharedObject == nil) {
    sharedObject = [[super allocWithZone:NULL] init];
  }

  return sharedObject;
}

+ (NSTimeInterval)getLiveReloadPeriod
{
  RCTDevMenuConfiguration *shared = [RCTDevMenuConfiguration sharedInstance];
  return shared.liveReloadPeriod;
}

+ (BOOL)getLiveReloadEnabled
{
  RCTDevMenuConfiguration *shared = [RCTDevMenuConfiguration sharedInstance];
  return shared.liveReloadEnabled;
}

+ (void)setLiveReloadPeriod:(NSTimeInterval)liveReloadPeriod
{
  RCTDevMenuConfiguration *shared = [RCTDevMenuConfiguration sharedInstance];
  shared.liveReloadPeriod = liveReloadPeriod;
}

+ (void)setLiveReloadEnabled:(BOOL)liveReloadEnabled
{
  RCTDevMenuConfiguration *shared = [RCTDevMenuConfiguration sharedInstance];
  shared.liveReloadEnabled = liveReloadEnabled;
}

@end

@interface RCTDevMenu () <UIActionSheetDelegate>

@end

@implementation RCTDevMenu
{
  NSTimer *_updateTimer;
  UIActionSheet *_actionSheet;
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

    _shakeToShow = YES;
    _liveReloadPeriod = [RCTDevMenuConfiguration getLiveReloadPeriod] ?: 1.0; // 1 second
    self.liveReloadEnabled = [RCTDevMenuConfiguration getLiveReloadEnabled];
    [[NSNotificationCenter defaultCenter] addObserver:self
                                             selector:@selector(showOnShake)
                                                 name:RCTShowDevMenuNotification
                                               object:nil];
  }
  return self;
}

- (void)showOnShake
{
  if (_shakeToShow) {
    [self show];
  }
}

- (void)show
{
  if (_actionSheet) {
    return;
  }

  NSString *debugTitleChrome = _bridge.executorClass && _bridge.executorClass == NSClassFromString(@"RCTWebSocketExecutor") ? @"Disable Chrome Debugging" : @"Enable Chrome Debugging";
  NSString *debugTitleSafari = _bridge.executorClass && _bridge.executorClass == NSClassFromString(@"RCTWebViewExecutor") ? @"Disable Safari Debugging" : @"Enable Safari Debugging";
  NSString *liveReloadTitle = _liveReloadEnabled ? @"Disable Live Reload" : @"Enable Live Reload";
  NSString *profilingTitle  = RCTProfileIsProfiling() ? @"Stop Profiling" : @"Start Profiling";

  UIActionSheet *actionSheet =
  [[UIActionSheet alloc] initWithTitle:@"React Native: Development"
                              delegate:self
                     cancelButtonTitle:@"Cancel"
                destructiveButtonTitle:nil
                     otherButtonTitles:@"Reload", debugTitleChrome, debugTitleSafari, liveReloadTitle, profilingTitle, nil];

  actionSheet.actionSheetStyle = UIBarStyleBlack;
  [actionSheet showInView:[UIApplication sharedApplication].keyWindow.rootViewController.view];
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  _actionSheet = nil;

  switch (buttonIndex) {
    case 0: {
      [_bridge reload];
      break;
    }
    case 1: {
      Class cls = NSClassFromString(@"RCTWebSocketExecutor");
      _bridge.executorClass = (_bridge.executorClass != cls) ? cls : nil;
      [_bridge reload];
      break;
    }
    case 2: {
      Class cls = NSClassFromString(@"RCTWebViewExecutor");
      _bridge.executorClass = (_bridge.executorClass != cls) ? cls : Nil;
      [_bridge reload];
      break;
    }
    case 3: {
      self.liveReloadEnabled = !_liveReloadEnabled;
      break;
    }
    case 4: {
      self.profilingEnabled = !_profilingEnabled;
      break;
    }
    default:
      break;
  }
}

- (void)setProfilingEnabled:(BOOL)enabled
{
  if (_profilingEnabled == enabled) {
    return;
  }

  _profilingEnabled = enabled;
  if (RCTProfileIsProfiling()) {
    [_bridge stopProfiling];
  } else {
    [_bridge startProfiling];
  }
}

- (void)setLiveReloadEnabled:(BOOL)enabled
{
  if (_liveReloadEnabled == enabled) {
    return;
  }

  _liveReloadEnabled = enabled;
  [RCTDevMenuConfiguration setLiveReloadEnabled:enabled];
  if (_liveReloadEnabled) {

    _updateTimer = [NSTimer scheduledTimerWithTimeInterval:_liveReloadPeriod
                                                    target:self
                                                  selector:@selector(pollForUpdates)
                                                  userInfo:nil
                                                   repeats:YES];
  } else {
    [_updateTimer invalidate];
    _updateTimer = nil;
  }
}

- (void)setLiveReloadPeriod:(NSTimeInterval)liveReloadPeriod
{
  _liveReloadPeriod = liveReloadPeriod;
  [RCTDevMenuConfiguration setLiveReloadPeriod:liveReloadPeriod];

   if (_liveReloadEnabled) {
     self.liveReloadEnabled = NO;
     self.liveReloadEnabled = YES;
   }
}

- (void)pollForUpdates
{
  RCTSourceCode *sourceCodeModule = _bridge.modules[RCTBridgeModuleNameForClass([RCTSourceCode class])];
  if (!sourceCodeModule) {
    RCTLogError(@"RCTSourceCode module not found");
    self.liveReloadEnabled = NO;
  }

  NSURL *longPollURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:sourceCodeModule.scriptURL];
  [NSURLConnection sendAsynchronousRequest:[NSURLRequest requestWithURL:longPollURL]
                                     queue:[[NSOperationQueue alloc] init]
                         completionHandler:^(NSURLResponse *response, NSData *data, NSError *connectionError) {

                           NSHTTPURLResponse *HTTPResponse = (NSHTTPURLResponse *)response;
                           if (_liveReloadEnabled && HTTPResponse.statusCode == 205) {
                             [_bridge reload];
                           }
                         }];
}

- (BOOL)isValid
{
  return !_liveReloadEnabled || _updateTimer != nil;
}

- (void)invalidate
{
  [_actionSheet dismissWithClickedButtonIndex:_actionSheet.cancelButtonIndex animated:YES];
  [_updateTimer invalidate];
  _updateTimer = nil;
  [[NSNotificationCenter defaultCenter] removeObserver:self];
}

@end

@implementation  RCTBridge (RCTDevMenu)

- (RCTDevMenu *)devMenu
{
  return self.modules[RCTBridgeModuleNameForClass([RCTDevMenu class])];
}

@end
