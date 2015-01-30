// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTLog.h"

#import "RCTBridge.h"

static RCTLogFunction injectedLogFunction;

void RCTInjectLogFunction(RCTLogFunction func) {
  injectedLogFunction = func;
}

// TODO (#5906496): // kinda ugly that this is tied to RCTBridge
NSString *_RCTLogObjects(NSArray *objects, NSString *level)
{
  NSString *str = objects[0];
#if TARGET_IPHONE_SIMULATOR
  if ([RCTBridge hasValidJSExecutor]) {
    fprintf(stderr, "%s\n", [str UTF8String]); // don't print timestamps and other junk
    [RCTBridge log:objects level:level];
  } else
#endif
  {
    // Print normal errors with timestamps when not in simulator.
    // Non errors are already compiled out above, so log as error here.
    if (injectedLogFunction) {
      injectedLogFunction(@">\n  %@", str);
    } else {
      NSLog(@">\n  %@", str);
    }
  }
  return str;
}
