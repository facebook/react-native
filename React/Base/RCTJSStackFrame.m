/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJSStackFrame.h"

#import "RCTLog.h"
#import "RCTUtils.h"

static NSRegularExpression *RCTJSStackFrameRegex()
{
  static dispatch_once_t onceToken;
  static NSRegularExpression *_regex;
  dispatch_once(&onceToken, ^{
    NSError *regexError;
    _regex = [NSRegularExpression regularExpressionWithPattern:@"^(?:([^@]+)@)?(.*):(\\d+):(\\d+)$" options:0 error:&regexError];
    if (regexError) {
      RCTLogError(@"Failed to build regex: %@", [regexError localizedDescription]);
    }
  });
  return _regex;
}

@implementation RCTJSStackFrame

- (instancetype)initWithMethodName:(NSString *)methodName file:(NSString *)file lineNumber:(NSInteger)lineNumber column:(NSInteger)column
{
  if (self = [super init]) {
    _methodName = methodName;
    _file = file;
    _lineNumber = lineNumber;
    _column = column;
  }
  return self;
}

- (NSDictionary *)toDictionary
{
  return @{
     @"methodName": RCTNullIfNil(self.methodName),
     @"file": RCTNullIfNil(self.file),
     @"lineNumber": @(self.lineNumber),
     @"column": @(self.column)
  };
}

+ (instancetype)stackFrameWithLine:(NSString *)line
{
  NSTextCheckingResult *match = [RCTJSStackFrameRegex() firstMatchInString:line options:0 range:NSMakeRange(0, line.length)];
  if (!match) {
    return nil;
  }

  // methodName may not be present for e.g. anonymous functions
  const NSRange methodNameRange = [match rangeAtIndex:1];
  NSString *methodName = methodNameRange.location == NSNotFound ? nil : [line substringWithRange:methodNameRange];
  NSString *file = [line substringWithRange:[match rangeAtIndex:2]];
  NSString *lineNumber = [line substringWithRange:[match rangeAtIndex:3]];
  NSString *column = [line substringWithRange:[match rangeAtIndex:4]];

  return [[self alloc] initWithMethodName:methodName
                                     file:file
                               lineNumber:[lineNumber integerValue]
                                   column:[column integerValue]];
}

+ (instancetype)stackFrameWithDictionary:(NSDictionary *)dict
{
  return [[self alloc] initWithMethodName:RCTNilIfNull(dict[@"methodName"])
                                     file:dict[@"file"]
                               lineNumber:[RCTNilIfNull(dict[@"lineNumber"]) integerValue]
                                   column:[RCTNilIfNull(dict[@"column"]) integerValue]];
}

+ (NSArray<RCTJSStackFrame *> *)stackFramesWithLines:(NSString *)lines
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSString *line in [lines componentsSeparatedByString:@"\n"]) {
    RCTJSStackFrame *frame = [self stackFrameWithLine:line];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

+ (NSArray<RCTJSStackFrame *> *)stackFramesWithDictionaries:(NSArray<NSDictionary *> *)dicts
{
  NSMutableArray *stack = [NSMutableArray new];
  for (NSDictionary *dict in dicts) {
    RCTJSStackFrame *frame = [self stackFrameWithDictionary:dict];
    if (frame) {
      [stack addObject:frame];
    }
  }
  return stack;
}

- (NSString *)description {
  return [NSString stringWithFormat:@"<%@: %p method name: %@; file name: %@; line: %ld; column: %ld>",
          self.class,
          self,
          self.methodName,
          self.file,
          (long)self.lineNumber,
          (long)self.column];
}

@end
