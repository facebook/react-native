/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <React/RCTConvert.h>
#import "RCTMessageActivityItemProvider.h"

@implementation RCTMessageActivityItemProvider


- (id) activityViewController:(UIActivityViewController *)activityViewController itemForActivityType:(NSString *)activityType
{
  for (id customMessageObject in self.messages) {
    NSDictionary * customMessage = [RCTConvert NSDictionary:customMessageObject];
    NSArray * types = [RCTConvert NSArray:[customMessage objectForKey:@"types"]];
    NSString * message = [RCTConvert NSString:[customMessage objectForKey:@"message"]];
    for (id typeObject in types) {
      NSString * type = [RCTConvert NSString:typeObject];
      if ([type hasSuffix:@"*"]) {
        // simple prefix match
        NSString * prefix = [type substringToIndex:type.length - 1];
        if ([activityType hasPrefix:prefix]) {
          return message;
        }
      }
      else if ([activityType isEqualToString:type]) {
        // exact match
        return message;
      }
    }
  }
  return self.message;
}


- (id) activityViewControllerPlaceholderItem:(UIActivityViewController *)activityViewController
{
  return @"";
}

@end
