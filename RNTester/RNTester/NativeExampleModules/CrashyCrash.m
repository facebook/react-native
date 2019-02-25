//
//  CrashyCrash.m
//  RNTester
//
//  Created by Pavlos Vinieratos on 25/02/2019.
//  Copyright © 2019 Facebook. All rights reserved.
//

#import "CrashyCrash.h"


@implementation CrashyCrash

RCT_EXPORT_MODULE();

RCT_EXPORT_METHOD(letsCrash)
{
  NSArray *a = @[@"wow"];
  NSString *s = [a objectAtIndex:42]; // native crash here
  NSLog(@"%@", s);
}

@end
