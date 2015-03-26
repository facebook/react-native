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

@interface RCTDevMenu () <UIActionSheetDelegate> {
  BOOL _liveReload;
}

@property (nonatomic, weak) RCTRootView *view;

@end

@implementation RCTDevMenu

- (instancetype)initWithRootView:(RCTRootView *)rootView
{
  if (self = [super init]) {
    self.view = rootView;
  }
  return self;
}

- (void)show
{
  NSString *debugTitle = self.view.executorClass == nil ? @"Enable Debugging" : @"Disable Debugging";
  NSString *liveReloadTitle = _liveReload ? @"Disable Live Reload" : @"Enable Live Reload";
  UIActionSheet *actionSheet = [[UIActionSheet alloc] initWithTitle:@"React Native: Development"
                                                           delegate:self
                                                  cancelButtonTitle:@"Cancel"
                                             destructiveButtonTitle:nil
                                                  otherButtonTitles:@"Reload", debugTitle, liveReloadTitle, nil];
  actionSheet.actionSheetStyle = UIBarStyleBlack;
  [actionSheet showInView:self.view];
}

- (void)actionSheet:(UIActionSheet *)actionSheet clickedButtonAtIndex:(NSInteger)buttonIndex
{
  if (buttonIndex == 0) {
    [self.view reload];
  } else if (buttonIndex == 1) {
    self.view.executorClass = self.view.executorClass == nil ? NSClassFromString(@"RCTWebSocketExecutor") : nil;
    [self.view reload];
  } else if (buttonIndex == 2) {
    _liveReload = !_liveReload;
    [self _pollAndReload];
  }
}

- (void)_pollAndReload
{
  if (_liveReload) {
    NSURL *url = [self.view scriptURL];
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
      [self.view reload];
    }
    [self _pollAndReload];
  });
}

@end
