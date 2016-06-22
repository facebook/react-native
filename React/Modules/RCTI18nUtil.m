/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTI18nUtil.h"

@implementation RCTI18nUtil

+ (id)sharedInstance {
   static RCTI18nUtil *sharedRCTI18nUtilInstance = nil;
   @synchronized(self) {
     if (sharedRCTI18nUtilInstance == nil)
      sharedRCTI18nUtilInstance = [self new];
   }
   return sharedRCTI18nUtilInstance;
}

- (BOOL)isRTL
{
  if ([self forceRTL]) return YES;
  return NO;
}

- (BOOL)forceRTL
{
  BOOL rtlStatus = [[NSUserDefaults standardUserDefaults]
                            boolForKey:@"RCTI18nUtil_forceRTL"];
  return rtlStatus;
}

- (void)setForceRTL:(BOOL)rtlStatus
{
  [[NSUserDefaults standardUserDefaults] setBool:rtlStatus forKey:@"RCTI18nUtil_forceRTL"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

@end
