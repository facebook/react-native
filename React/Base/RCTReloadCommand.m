/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTReloadCommand.h"

#import "RCTAssert.h"
#import "RCTKeyCommands.h"

/** main queue only */
static NSHashTable<id<RCTReloadListener>> *listeners;

void RCTRegisterReloadCommandListener(id<RCTReloadListener> listener)
{
  RCTAssertMainQueue(); // because registerKeyCommandWithInput: must be called on the main thread
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    listeners = [NSHashTable weakObjectsHashTable];
    [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                   modifierFlags:UIKeyModifierCommand
                                                          action:
     ^(__unused UIKeyCommand *command) {
       RCTTriggerReloadCommandListeners();
     }];
  });
  [listeners addObject:listener];
}

void RCTTriggerReloadCommandListeners(void)
{
  RCTAssertMainQueue();
  // Copy to protect against mutation-during-enumeration.
  // If listeners hasn't been initialized yet we get nil, which works just fine.
  NSArray<id<RCTReloadListener>> *copiedListeners = [listeners allObjects];
  for (id<RCTReloadListener> l in copiedListeners) {
    [l didReceiveReloadCommand];
  }
}
