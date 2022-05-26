/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTReloadCommand.h"

#import "RCTAssert.h"
#import "RCTKeyCommands.h"
#import "RCTUtils.h"

static NSHashTable<id<RCTReloadListener>> *listeners;
static NSLock *listenersLock;
static NSURL *bundleURL;

NSString *const RCTTriggerReloadCommandNotification = @"RCTTriggerReloadCommandNotification";
NSString *const RCTTriggerReloadCommandReasonKey = @"reason";
NSString *const RCTTriggerReloadCommandBundleURLKey = @"bundleURL";

void RCTRegisterReloadCommandListener(id<RCTReloadListener> listener)
{
  if (!listenersLock) {
    listenersLock = [NSLock new];
  }
  [listenersLock lock];
  if (!listeners) {
    listeners = [NSHashTable weakObjectsHashTable];
  }
#if RCT_DEV
  RCTAssertMainQueue(); // because registerKeyCommandWithInput: must be called on the main thread
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                   modifierFlags:UIKeyModifierCommand
                                                          action:^(__unused UIKeyCommand *command) {
                                                            RCTTriggerReloadCommandListeners(@"Command + R");
                                                          }];
  });
#endif
  [listeners addObject:listener];
  [listenersLock unlock];
}

void RCTTriggerReloadCommandListeners(NSString *reason)
{
  [listenersLock lock];
  [[NSNotificationCenter defaultCenter] postNotificationName:RCTTriggerReloadCommandNotification
                                                      object:nil
                                                    userInfo:@{
                                                      RCTTriggerReloadCommandReasonKey : RCTNullIfNil(reason),
                                                      RCTTriggerReloadCommandBundleURLKey : RCTNullIfNil(bundleURL)
                                                    }];

  for (id<RCTReloadListener> l in [listeners allObjects]) {
    [l didReceiveReloadCommand];
  }
  [listenersLock unlock];
}

void RCTReloadCommandSetBundleURL(NSURL *URL)
{
  bundleURL = URL;
}
