/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDevMenu.h"

#import "RCTRedBox.h"
#import "RCTRootView.h"
#import "RCTSourceCode.h"
#import "RCTWebViewExecutor.h"

@interface RCTBridge (RCTDevMenu)

@property (nonatomic, copy, readonly) NSArray *profile;

- (void)startProfiling;
- (void)stopProfiling;

@end

@interface RCTDevMenu () <UIActionSheetDelegate>

@end

@implementation RCTDevMenu
{
  BOOL _liveReload;
  __weak RCTBridge *_bridge;
}

- (instancetype)initWithBridge:(RCTBridge *)bridge
{
  if (self = [super init]) {
    _bridge = bridge;
  }
  return self;
}

- (void)show
{
  NSString *debugTitleChrome = _bridge.executorClass != Nil && _bridge.executorClass == NSClassFromString(@"RCTWebSocketExecutor") ? @"Disable Chrome Debugging" : @"Enable Chrome Debugging";
  NSString *debugTitleSafari = _bridge.executorClass == [RCTWebViewExecutor class] ? @"Disable Safari Debugging" : @"Enable Safari Debugging";
  NSString *liveReloadTitle = _liveReload ? @"Disable Live Reload" : @"Enable Live Reload";
  NSString *profilingTitle  = _bridge.profile ? @"Stop Profiling" : @"Start Profiling";
  UIActionSheet *actionSheet = [[UIActionSheet alloc] initWithTitle:@"React Native: Development"
                                                           delegate:self
                                                  cancelButtonTitle:@"Cancel"
                                             destructiveButtonTitle:nil
                                                  otherButtonTitles:@"Reload", debugTitleChrome, debugTitleSafari, liveReloadTitle, profilingTitle, nil];
  actionSheet.actionSheetStyle = UIBarStyleBlack;
  [actionSheet showInView:[[[[UIApplication sharedApplication] keyWindow] rootViewController] view]];
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  if (buttonIndex == 0) {
    [_bridge reload];
  } else if (buttonIndex == 1) {
    Class cls = NSClassFromString(@"RCTWebSocketExecutor");
    _bridge.executorClass = (_bridge.executorClass != cls) ? cls : nil;
    [_bridge reload];
  } else if (buttonIndex == 2) {
    Class cls = [RCTWebViewExecutor class];
    _bridge.executorClass = (_bridge.executorClass != cls) ? cls : Nil;
    [_bridge reload];
  } else if (buttonIndex == 3) {
    _liveReload = !_liveReload;
    [self _pollAndReload];
  } else if (buttonIndex == 4) {
    if (_bridge.profile) {
      [_bridge stopProfiling];
    } else {
      [_bridge startProfiling];
    }
  }
}

- (void)_pollAndReload
{
  if (_liveReload) {
    RCTSourceCode *sourceCodeModule = _bridge.modules[RCTBridgeModuleNameForClass([RCTSourceCode class])];
    NSURL *url = sourceCodeModule.scriptURL;
    NSURL *longPollURL = [[NSURL alloc] initWithString:@"/onchange" relativeToURL:url];
    [self performSelectorInBackground:@selector(_checkForUpdates:) withObject:longPollURL];
  }
}

- (void)_checkForUpdates:(NSURL *)URL
{
  NSMutableURLRequest *longPollRequest = [NSMutableURLRequest requestWithURL:URL];
  longPollRequest.timeoutInterval = 30;
  NSHTTPURLResponse *response;
  [NSURLConnection sendSynchronousRequest:longPollRequest returningResponse:&response error:nil];

  dispatch_async(dispatch_get_main_queue(), ^{
    if (_liveReload && response.statusCode == 205) {
      [[RCTRedBox sharedInstance] dismiss];
      [_bridge reload];
    }
    [self _pollAndReload];
  });
}

@end
