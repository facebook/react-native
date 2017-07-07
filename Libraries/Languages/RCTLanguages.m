/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTLanguages.h"

#import <UIKit/UIKit.h>

@implementation RCTLanguages

RCT_EXPORT_MODULE();

#pragma mark - Private API

- (NSMutableArray *)ensureLanguageTags:(NSArray *)languages
{
  NSMutableArray *sanitizedLanguages = [NSMutableArray array];

  for (id language in languages) {
    [sanitizedLanguages addObject:[language stringByReplacingOccurrencesOfString:@"_" withString:@"-"]];
  }

  return sanitizedLanguages;
}

#pragma mark - Public API

- (NSDictionary *)constantsToExport
{
  NSArray *preferredLanguages = [[[UIDevice currentDevice] systemVersion] floatValue] >= 9
    ? [NSLocale preferredLanguages]
    : [self ensureLanguageTags:[NSLocale preferredLanguages]];

  return @{
    @"language": [preferredLanguages objectAtIndex:0],
    @"languages": preferredLanguages
  };
}

@end
