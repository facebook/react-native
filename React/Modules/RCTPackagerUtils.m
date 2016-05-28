/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTPackagerUtils.h"

NSString *IP_ADDR;

@implementation RCTPackagerUtils

+ (void)initialize
{
  NSString *ip = [[NSBundle mainBundle] pathForResource:@"ip" ofType:@"txt"];
  ip = [NSString stringWithContentsOfFile:ip encoding:NSUTF8StringEncoding error: nil];
  ip = [ip stringByTrimmingCharactersInSet:[NSCharacterSet characterSetWithCharactersInString:@"\n"]];
  IP_ADDR = ip ?: @"127.0.0.1";
}

+ (NSURL *)URLForPath:(NSString *)path
{
  NSUserDefaults *standardDefaults = [NSUserDefaults standardUserDefaults];
  NSInteger port = [standardDefaults integerForKey:@"websocket-executor-port"] ?: 8081;

  return [NSURL URLWithString:[NSString stringWithFormat:@"http://%@:%zd/%@", IP_ADDR, port, path]];
}

@end
