/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCxxUtils.h"

#include <JsErrorHandler/JsErrorHandler.h>

#import <React/RCTConstants.h>
#import <React/RCTFollyConvert.h>
#import <React/RCTModuleData.h>
#import <React/RCTUtils.h>
#import <cxxreact/CxxNativeModule.h>
#import <jsi/jsi.h>

#import "DispatchMessageQueueThread.h"
#import "RCTCxxModule.h"
#import "RCTNativeModule.h"

namespace facebook {
namespace react {

std::vector<std::unique_ptr<NativeModule>>
createNativeModules(NSArray<RCTModuleData *> *modules, RCTBridge *bridge, const std::shared_ptr<Instance> &instance)
{
  std::vector<std::unique_ptr<NativeModule>> nativeModules;
  for (RCTModuleData *moduleData in modules) {
    if ([moduleData.moduleClass isSubclassOfClass:[RCTCxxModule class]]) {
      nativeModules.emplace_back(std::make_unique<CxxNativeModule>(
          instance,
          [moduleData.name UTF8String],
          [moduleData] { return [(RCTCxxModule *)(moduleData.instance) createModule]; },
          std::make_shared<DispatchMessageQueueThread>(moduleData)));
    } else {
      nativeModules.emplace_back(std::make_unique<RCTNativeModule>(bridge, moduleData));
    }
  }
  return nativeModules;
}

static NSError *errorWithException(const std::exception &e)
{
  NSString *msg;
  NSMutableDictionary *errorInfo = [NSMutableDictionary dictionary];

  const auto *jsError = dynamic_cast<const jsi::JSError *>(&e);
  if (jsError && RCTGetParseUnhandledJSErrorStackNatively()) {
    MapBuffer errorMap = JsErrorHandler::parseErrorStack(*jsError, true, false);

    NSString *message = [NSString stringWithCString:errorMap.getString(JSErrorHandlerKey::kErrorMessage).c_str()
                                           encoding:[NSString defaultCStringEncoding]];
    auto frames = errorMap.getMapBufferList(JSErrorHandlerKey::kAllStackFrames);
    NSMutableArray *stack = [[NSMutableArray alloc] init];
    for (auto const &mapBuffer : frames) {
      NSDictionary *frame = @{
        @"file" : [NSString stringWithCString:mapBuffer.getString(JSErrorHandlerKey::kFrameFileName).c_str()
                                     encoding:[NSString defaultCStringEncoding]],
        @"methodName" : [NSString stringWithCString:mapBuffer.getString(JSErrorHandlerKey::kFrameMethodName).c_str()
                                           encoding:[NSString defaultCStringEncoding]],
        @"lineNumber" : [NSNumber numberWithInt:mapBuffer.getInt(JSErrorHandlerKey::kFrameLineNumber)],
        @"column" : [NSNumber numberWithInt:mapBuffer.getInt(JSErrorHandlerKey::kFrameColumnNumber)],
      };
      [stack addObject:frame];
    }

    msg = [@"Unhandled JS Exception: " stringByAppendingString:message];
    errorInfo[RCTJSStackTraceKey] = stack;
    errorInfo[RCTJSRawStackTraceKey] = @(e.what());
  } else {
    msg = @(e.what());
  }

  NSError *nestedError;
  try {
    std::rethrow_if_nested(e);
  } catch (const std::exception &e) {
    nestedError = errorWithException(e);
  } catch (...) {
  }

  if (nestedError) {
    msg = [NSString stringWithFormat:@"%@\n\n%@", msg, [nestedError localizedDescription]];
  }

  errorInfo[NSLocalizedDescriptionKey] = msg;
  return [NSError errorWithDomain:RCTErrorDomain code:1 userInfo:errorInfo];
}

NSError *tryAndReturnError(const std::function<void()> &func)
{
  try {
    @try {
      func();
      return nil;
    } @catch (NSException *exception) {
      return RCTErrorWithNSException(exception);
    } @catch (id exception) {
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

NSString *deriveSourceURL(NSURL *url)
{
  NSString *sourceUrl;
  if (url.isFileURL) {
    // Url will contain only path to resource (i.g. file:// will be removed)
    sourceUrl = url.path;
  } else {
    // Url will include protocol (e.g. http://)
    sourceUrl = url.absoluteString;
  }
  return sourceUrl ?: @"";
}

}
}
