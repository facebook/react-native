/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTI18nUtil.h"

#import <UIKit/UIKit.h>

@implementation RCTI18nUtil

+ (instancetype)sharedInstance
{
  static RCTI18nUtil *sharedInstance;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    sharedInstance = [self new];
    [sharedInstance swapLeftAndRightInRTL:true];
    [sharedInstance allowRTL:true];
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

// Check if the current device language is RTL
- (BOOL)isDevicePreferredLanguageRTL
{
  NSLocaleLanguageDirection direction =
      [NSLocale characterDirectionForLanguage:[[NSLocale preferredLanguages] objectAtIndex:0]];
  return direction == NSLocaleLanguageDirectionRightToLeft;
}

// Check if the current application language is RTL
- (BOOL)isApplicationPreferredLanguageRTL
{
  NSWritingDirection direction = [NSParagraphStyle defaultWritingDirectionForLanguage:nil];
  return direction == NSWritingDirectionRightToLeft;
}

@end
