/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTCxxUtils.h"

#import <React/RCTFollyConvert.h>
#import <React/RCTUtils.h>

#include <jschelpers/Value.h>

using namespace facebook::react;

@implementation RCTConvert (folly)

+ (folly::dynamic)folly_dynamic:(id)json;
{
  if (json == nil || json == (id)kCFNull) {
    return nullptr;
  } else {
    folly::dynamic dyn = convertIdToFollyDynamic(json);
     if (dyn == nil) {
       RCTAssert(false, @"RCTConvert input json is of an impossible type");
     }
     return dyn;
  }
}

@end

namespace facebook {
namespace react {

JSContext *contextForGlobalContextRef(JSGlobalContextRef contextRef)
{
  static std::mutex s_mutex;
  static NSMapTable *s_contextCache;

  if (!contextRef) {
    return nil;
  }

  // Adding our own lock here, since JSC internal ones are insufficient
  std::lock_guard<std::mutex> lock(s_mutex);
  if (!s_contextCache) {
    NSPointerFunctionsOptions keyOptions = NSPointerFunctionsOpaqueMemory | NSPointerFunctionsOpaquePersonality;
    NSPointerFunctionsOptions valueOptions = NSPointerFunctionsWeakMemory | NSPointerFunctionsObjectPersonality;
    s_contextCache = [[NSMapTable alloc] initWithKeyOptions:keyOptions valueOptions:valueOptions capacity:0];
  }

  JSContext *ctx = [s_contextCache objectForKey:(__bridge id)contextRef];
  if (!ctx) {
    ctx = [JSC_JSContext(contextRef) contextWithJSGlobalContextRef:contextRef];
    [s_contextCache setObject:ctx forKey:(__bridge id)contextRef];
  }
  return ctx;
}

static NSError *errorWithException(const std::exception& e)
{
  NSString *msg = @(e.what());
  NSMutableDictionary *errorInfo = [NSMutableDictionary dictionary];

  const JSException *jsException = dynamic_cast<const JSException*>(&e);
  if (jsException) {
    errorInfo[RCTJSRawStackTraceKey] = @(jsException->getStack().c_str());
    msg = [@"Unhandled JS Exception: " stringByAppendingString:msg];
  }

  NSError *nestedError;
  try {
    std::rethrow_if_nested(e);
  } catch(const std::exception& e) {
    nestedError = errorWithException(e);
  } catch(...) {}

  if (nestedError) {
    msg = [NSString stringWithFormat:@"%@\n\n%@", msg, [nestedError localizedDescription]];
  }

  errorInfo[NSLocalizedDescriptionKey] = msg;
  return [NSError errorWithDomain:RCTErrorDomain code:1 userInfo:errorInfo];
}

NSError *tryAndReturnError(const std::function<void()>& func) {
  try {
    @try {
      func();
      return nil;
    }
    @catch (NSException *exception) {
      NSString *message =
      [NSString stringWithFormat:@"Exception '%@' was thrown from JS thread", exception];
      return RCTErrorWithMessage(message);
    }
    @catch (id exception) {
      // This will catch any other ObjC exception, but no C++ exceptions
      return RCTErrorWithMessage(@"non-std ObjC Exception");
    }
  } catch (const std::exception &ex) {
    return errorWithException(ex);
  } catch (...) {
    // On a 64-bit platform, this would catch ObjC exceptions, too, but not on
    // 32-bit platforms, so we catch those with id exceptions above.
    return RCTErrorWithMessage(@"non-std C++ exception");
  }
}

} }
