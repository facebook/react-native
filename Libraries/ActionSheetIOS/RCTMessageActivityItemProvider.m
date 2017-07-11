/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTMessageActivityItemProvider.h"

@implementation RCTMessageActivityItemProvider


- (id) activityViewController:(UIActivityViewController *)activityViewController itemForActivityType:(NSString *)activityType
{
  if ([activityType isEqualToString:@"net.whatsapp.WhatsApp.ShareExtension"]) {
    return [self.message stringByReplacingOccurrencesOfString:@"\n" withString:@"<br/>"];
  }
  return self.message;
}


- (id) activityViewControllerPlaceholderItem:(UIActivityViewController *)activityViewController
{
  return @"";
}

@end
