/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#import "RCTJavaScriptExecutorSource.h"

typedef NS_ENUM(NSUInteger, RCTStandardExecutorType) {
  RCTStandardExecutorTypeDefault,
  RCTStandardExecutorTypeUIWebView,
  RCTStandardExecutorTypeWebSocket,
};

@interface RCTStandardExecutorSource : NSObject <RCTJavaScriptExecutorSource>

@property (nonatomic) RCTStandardExecutorType executorType;

- (id<RCTJavaScriptExecutor>)executor;

@end
