/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTApplicationShortcutsManager.h"

#import "RCTBridge.h"
#import "RCTLog.h"
#import "RCTUtils.h"

@implementation RCTApplicationShortcutsManager

@synthesize bridge = _bridge;

RCT_EXPORT_MODULE()

RCT_EXPORT_METHOD(setApplicationShortcutsWithList: (NSArray *)list)
{
  if (RCTRunningInAppExtension()) {
    RCTLogError(@"Unable to set application shortcuts from app extension");
    return;
  }
  NSMutableArray <UIApplicationShortcutItem *> *shortcutItems =
    [[NSMutableArray alloc] init];
  for (NSDictionary *shortcutDefinition in list) {
    UIMutableApplicationShortcutItem *shortcutItem =
      [[UIMutableApplicationShortcutItem alloc]
        initWithType: shortcutDefinition[@"type"]
        localizedTitle: shortcutDefinition[@"title"]];
    if ([shortcutDefinition objectForKey:@"subtitle"]) {
      [shortcutItem setLocalizedSubtitle: shortcutDefinition[@"subtitle"]];
    }
    [shortcutItems addObject: shortcutItem];
  }
  [[UIApplication sharedApplication] setShortcutItems: shortcutItems];
}

- (NSDictionary *)constantsToExport
{
  UIApplicationShortcutItem *shortcut =
    _bridge.launchOptions[UIApplicationLaunchOptionsShortcutItemKey];
  return @{@"initialShortcutType": RCTNullIfNil(shortcut.type)};
}

@end
