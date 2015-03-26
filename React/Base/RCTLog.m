/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTLog.h"

#import "RCTBridge.h"

__unsafe_unretained NSString *RCTLogLevels[] = {
  @"info",
  @"warn",
  @"error",
  @"mustfix"
};

static void (^RCTInjectedLogFunction)(NSString *msg);

void RCTInjectLogFunction(void (^logFunction)(NSString *msg)) {
  RCTInjectedLogFunction = logFunction;
}

static inline NSString *_RCTLogPreamble(const char *file, int lineNumber, const char *funcName)
{
  NSString *threadName = [[NSThread currentThread] name];
  NSString *fileName=[[NSString stringWithUTF8String:file] lastPathComponent];
  if (!threadName || threadName.length <= 0) {
    threadName = [NSString stringWithFormat:@"%p", [NSThread currentThread]];
  }
  return [NSString stringWithFormat:@"[RCTLog][tid:%@][%@:%d]>", threadName, fileName, lineNumber];
}

// TODO (#5906496): Does this need to be tied to RCTBridge?
NSString *RCTLogObjects(NSArray *objects, NSString *level)
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
    if (RCTInjectedLogFunction) {
      RCTInjectedLogFunction(str);
    } else {
      NSLog(@">\n  %@", str);
    }
  }
  return str;
}

// Returns array of objects.  First arg is a simple string to print, remaining args
// are objects to pass through to the debugger so they are inspectable in the console.
NSArray *RCTLogFormat(const char *file, int lineNumber, const char *funcName, NSString *format, ...)
{
  va_list args;
  va_start(args, format);
  NSString *preamble = _RCTLogPreamble(file, lineNumber, funcName);

  // Pull out NSObjects so we can pass them through as inspectable objects to the js debugger
  NSArray *formatParts = [format componentsSeparatedByString:@"%"];
  NSMutableArray *objects = [NSMutableArray arrayWithObject:preamble];
  BOOL valid = YES;
  for (int i = 0; i < formatParts.count; i++) {
    if (i == 0) { // first part is always a string
      [objects addObject:formatParts[i]];
    } else {
      if (valid && [formatParts[i] length] && [formatParts[i] characterAtIndex:0] == '@') {
        id obj = va_arg(args, id);
        [objects addObject:obj ?: @"null"];
        [objects addObject:[formatParts[i] substringFromIndex:1]]; // remove formatting char
      } else {
        // We could determine the type (double, int?) of the va_arg by parsing the formatPart, but for now we just bail.
        valid = NO;
        [objects addObject:[NSString stringWithFormat:@"unknown object for %%%@", formatParts[i]]];
      }
    }
  }
  va_end(args);
  va_start(args, format);
  NSString *strOut = [preamble stringByAppendingString:[[NSString alloc] initWithFormat:format arguments:args]];
  va_end(args);
  NSMutableArray *objectsOut = [NSMutableArray arrayWithObject:strOut];
  [objectsOut addObjectsFromArray:objects];
  return objectsOut;
}
