/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import <Foundation/Foundation.h>

@interface RCTJSStackFrame : NSObject

@property (nonatomic, copy, readonly) NSString *methodName;
@property (nonatomic, copy, readonly) NSString *file;
@property (nonatomic, readonly) NSInteger lineNumber;
@property (nonatomic, readonly) NSInteger column;
@property (nonatomic, readonly) NSInteger collapse;

- (instancetype)initWithMethodName:(NSString *)methodName
                              file:(NSString *)file
                        lineNumber:(NSInteger)lineNumber
                            column:(NSInteger)column
                          collapse:(NSInteger)collapse;
- (NSDictionary *)toDictionary;

+ (instancetype)stackFrameWithLine:(NSString *)line;
+ (instancetype)stackFrameWithDictionary:(NSDictionary *)dict;
+ (NSArray<RCTJSStackFrame *> *)stackFramesWithLines:(NSString *)lines;
+ (NSArray<RCTJSStackFrame *> *)stackFramesWithDictionaries:(NSArray<NSDictionary *> *)dicts;

@end
