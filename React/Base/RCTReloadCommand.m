/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTReloadCommand.h"

#import "RCTKeyCommands.h"

void RCTRegisterReloadCommandListener(id<RCTReloadListener> listener)
{
  static NSHashTable<id<RCTReloadListener>> *listeners;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    listeners = [NSHashTable weakObjectsHashTable];
    [[RCTKeyCommands sharedInstance] registerKeyCommandWithInput:@"r"
                                                   modifierFlags:UIKeyModifierCommand
                                                          action:
     ^(__unused UIKeyCommand *command) {
       NSArray<id<RCTReloadListener>> *copiedListeners;
       @synchronized (listeners) { // avoid mutation-while-enumerating
         copiedListeners = [listeners allObjects];
       }
       for (id<RCTReloadListener> l in copiedListeners) {
         [l didReceiveReloadCommand];
       }
     }];
  });

  @synchronized (listeners) {
    [listeners addObject:listener];
  }
}
