/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import <Foundation/Foundation.h>

#define RCTErrorDomain @"RCTErrorDomain"

#define RCTAssert(condition, message, ...) _RCTAssert((condition) != 0, message, ##__VA_ARGS__)
#define RCTCAssert(condition, message, ...) _RCTCAssert((condition) != 0, message, ##__VA_ARGS__)

typedef void (^RCTAssertFunction)(BOOL condition, NSString *message, ...);

extern RCTAssertFunction RCTInjectedAssertFunction;
extern RCTAssertFunction RCTInjectedCAssertFunction;

void RCTInjectAssertFunctions(RCTAssertFunction assertFunction, RCTAssertFunction cAssertFunction);

#define _RCTAssert(condition, message, ...) \
do { \
  if (RCTInjectedAssertFunction) { \
    RCTInjectedAssertFunction(condition, message, ##__VA_ARGS__); \
  } else { \
    NSAssert(condition, message, ##__VA_ARGS__); \
  } \
} while (false)

#define _RCTCAssert(condition, message, ...) \
do { \
  if (RCTInjectedCAssertFunction) { \
    RCTInjectedCAssertFunction(condition, message, ##__VA_ARGS__); \
  } else { \
    NSCAssert(condition, message, ##__VA_ARGS__); \
  } \
} while (false)

#define RCTAssertMainThread() RCTAssert([NSThread isMainThread], @"This method must be called on the main thread");
#define RCTCAssertMainThread() RCTCAssert([NSThread isMainThread], @"This function must be called on the main thread");
