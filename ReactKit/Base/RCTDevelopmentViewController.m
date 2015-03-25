/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTDevelopmentViewController.h"

#import "RCTRedBox.h"
#import "RCTRootView.h"

@interface RCTDevelopmentViewController () <UIActionSheetDelegate> {
  BOOL _liveReload;
}

@property (nonatomic, readonly) RCTRootView *RCTView;

@end

@implementation RCTDevelopmentViewController

- (BOOL)canBecomeFirstResponder
{
  return YES;
}

- (RCTRootView *)RCTView
{
  return (RCTRootView *)self.view;
}

- (void)motionEnded:(UIEventSubtype)motion withEvent:(UIEvent *)event
{
  if (motion == UIEventSubtypeMotionShake)
  {
    NSString *debugTitle = self.RCTView.executorClass == nil ? @"Enable Debugging" : @"Disable Debugging";
    NSString *liveReloadTitle = _liveReload ? @"Disable Live Reload" : @"Enable Live Reload";
    UIActionSheet *actionSheet = [[UIActionSheet alloc] initWithTitle:@"React Native: Development"
                                                             delegate:self
                                                    cancelButtonTitle:@"Cancel"
                                               destructiveButtonTitle:nil
                                                    otherButtonTitles:@"Reload", debugTitle, liveReloadTitle, nil];
    actionSheet.actionSheetStyle = UIBarStyleBlack;
    [actionSheet showInView:self.view];
  }
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  if (buttonIndex == 0) {
    [self.RCTView reload];
  } else if (buttonIndex == 1) {
    self.RCTView.executorClass = self.RCTView.executorClass == nil ? NSClassFromString(@"RCTWebSocketExecutor") : nil;
    [self.RCTView reload];
  } else if (buttonIndex == 2) {
    _liveReload = !_liveReload;
    [self _pollAndReload];
  }
}

- (void)_pollAndReload
{
  if (_liveReload) {
    NSURL *url = [self.RCTView scriptURL];
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
      [self.RCTView reload];
    }
    [self _pollAndReload];
  });
}

@end
