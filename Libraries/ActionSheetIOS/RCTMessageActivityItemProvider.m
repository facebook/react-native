//
//  RCTMessageActivityItemProvider.m
//  RCTActionSheet
//
//  Created by Poon Kwok Cheung on 11/7/2017.
//  Copyright © 2017 Facebook. All rights reserved.
//

#import "RCTMessageActivityItemProvider.h"

@implementation RCTMessageActivityItemProvider


- (id) activityViewController:(UIActivityViewController *)activityViewController itemForActivityType:(NSString *)activityType
{
  if([activityType isEqualToString:@"net.whatsapp.WhatsApp.ShareExtension"]) {
    return [self.message stringByReplacingOccurrencesOfString:@"\n" withString:@"<br/>"];
  }
  return self.message;
}


- (id) activityViewControllerPlaceholderItem:(UIActivityViewController *)activityViewController
{
  return @"";
}

@end
