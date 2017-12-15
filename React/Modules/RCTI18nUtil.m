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

+ (instancetype)sharedInstance
{
  static RCTI18nUtil *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
    [sharedInstance swapLeftAndRightInRTL: true];
  });
  
  return sharedInstance;
}

/**
 * Check if the app is currently running on an RTL locale.
 * This only happens when the app:
 * - is forcing RTL layout, regardless of the active language (for development purpose)
 * - allows RTL layout when using RTL locale
 */
- (BOOL)isRTL
{
  if ([self isRTLForced]) {
    return YES;
  }
  if ([self isRTLAllowed] && [self isApplicationPreferredLanguageRTL]) {
    return YES;
  }
  return NO;
}

/**
 * Should be used very early during app start up
 * Before the bridge is initialized
 * @return whether the app allows RTL layout, default is true
 */
- (BOOL)isRTLAllowed
{
  NSNumber *value = [[NSUserDefaults standardUserDefaults] objectForKey:@"RCTI18nUtil_allowRTL"];
  if (value == nil) {
    return YES;
  }
  return [value boolValue];
}

- (void)allowRTL:(BOOL)rtlStatus
{
  [[NSUserDefaults standardUserDefaults] setBool:rtlStatus forKey:@"RCTI18nUtil_allowRTL"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

/**
 * Could be used to test RTL layout with English
 * Used for development and testing purpose
 */
- (BOOL)isRTLForced
{
  BOOL rtlStatus = [[NSUserDefaults standardUserDefaults]
                            boolForKey:@"RCTI18nUtil_forceRTL"];
  return rtlStatus;
}

- (void)forceRTL:(BOOL)rtlStatus
{
  [[NSUserDefaults standardUserDefaults] setBool:rtlStatus forKey:@"RCTI18nUtil_forceRTL"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

- (BOOL)doLeftAndRightSwapInRTL
{
  return [[NSUserDefaults standardUserDefaults] boolForKey:@"RCTI18nUtil_makeRTLFlipLeftAndRightStyles"];
}

- (void)swapLeftAndRightInRTL:(BOOL)value
{
  [[NSUserDefaults standardUserDefaults] setBool:value forKey:@"RCTI18nUtil_makeRTLFlipLeftAndRightStyles"];
  [[NSUserDefaults standardUserDefaults] synchronize];
}

// Check if the current device language is RTL
- (BOOL)isDevicePreferredLanguageRTL
{
  NSLocaleLanguageDirection direction = [NSLocale characterDirectionForLanguage:[[NSLocale preferredLanguages] objectAtIndex:0]];
  return direction == NSLocaleLanguageDirectionRightToLeft;
}

// Check if the current application language is RTL
- (BOOL)isApplicationPreferredLanguageRTL
{
  NSString *preferredAppLanguage = [[[NSBundle mainBundle] preferredLocalizations] objectAtIndex:0];
  NSLocaleLanguageDirection direction = [NSLocale characterDirectionForLanguage:preferredAppLanguage];
  return direction == NSLocaleLanguageDirectionRightToLeft;
}

@end
