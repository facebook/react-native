/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTQuickActionsManager.h"

#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTQuickActionsManager

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(setQuickActionsWithActionList:
                  (NSArray <NSDictionary *> *)actionList)
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to set quick actions from app extension");
    return;
  }
  NSMutableArray <UIApplicationShortcutItem *> *shortcutItems =
    [[NSMutableArray alloc] init];
  for (NSDictionary *action in actionList) {
    UIMutableApplicationShortcutItem *shortcutItem =
      [[UIMutableApplicationShortcutItem alloc]
        initWithType: action[@"type"]
        localizedTitle: action[@"title"]];
    if ([action objectForKey:@"subtitle"]) {
      [shortcutItem setLocalizedSubtitle: action[@"subtitle"]];
    }
    [shortcutItems addObject: shortcutItem];
  }
  [[UIApplication sharedApplication] setShortcutItems: shortcutItems];
}

@end
