// Copyright 2004-present Facebook. All Rights Reserved.

#import "RCTLog.h"

#import "RCTBridge.h"

static RCTLogFunction injectedLogFunction;

void RCTInjectLogFunction(RCTLogFunction func) {
  injectedLogFunction = func;
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

// Returns array of objects.  First arg is a simple string to print, remaining args are objects to pass through to the debugger so they are
// inspectable in the console.
NSArray *_RCTLogFormat(const char *file, int lineNumber, const char *funcName, NSString *format, ...)
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

NSString *_RCTLogFormatString(const char *file, int lineNumber, const char *funcName, NSString *format, ...)
{
  va_list args;
  va_start (args, format);
  NSString *body =  [[NSString alloc] initWithFormat:format arguments:args];
  va_end (args);
  return [NSString stringWithFormat:@"%@ %@", _RCTLogPreamble(file, lineNumber, funcName), body];
}
