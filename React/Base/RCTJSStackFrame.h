/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@interface RCTJSStackFrame : NSObject

@property (nonatomic, copy, readonly) NSString *methodName;
@property (nonatomic, copy, readonly) NSString *file;
@property (nonatomic, readonly) NSInteger lineNumber;
@property (nonatomic, readonly) NSInteger column;

- (instancetype)initWithMethodName:(NSString *)methodName file:(NSString *)file lineNumber:(NSInteger)lineNumber column:(NSInteger)column;
- (NSDictionary *)toDictionary;

+ (instancetype)stackFrameWithLine:(NSString *)line;
+ (instancetype)stackFrameWithDictionary:(NSDictionary *)dict;
+ (NSArray<RCTJSStackFrame *> *)stackFramesWithLines:(NSString *)lines;
+ (NSArray<RCTJSStackFrame *> *)stackFramesWithDictionaries:(NSArray<NSDictionary *> *)dicts;

@end
