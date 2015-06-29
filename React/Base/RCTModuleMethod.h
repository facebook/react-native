/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

@class RCTBridge;

typedef NS_ENUM(NSUInteger, RCTJavaScriptFunctionKind) {
  RCTJavaScriptFunctionKindNormal,
  RCTJavaScriptFunctionKindAsync,
};

@interface RCTModuleMethod : NSObject

@property (nonatomic, copy, readonly) NSString *moduleClassName;
@property (nonatomic, copy, readonly) NSString *JSMethodName;
@property (nonatomic, assign, readonly) SEL selector;
@property (nonatomic, assign, readonly) RCTJavaScriptFunctionKind functionKind;

- (instancetype)initWithObjCMethodName:(NSString *)objCMethodName
                          JSMethodName:(NSString *)JSMethodName
                           moduleClass:(Class)moduleClass NS_DESIGNATED_INITIALIZER;

- (void)invokeWithBridge:(RCTBridge *)bridge
                  module:(id)module
               arguments:(NSArray *)arguments
                 context:(NSNumber *)context;

@end
