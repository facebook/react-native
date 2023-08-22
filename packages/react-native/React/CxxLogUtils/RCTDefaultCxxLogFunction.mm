/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTDefaultCxxLogFunction.h"
#import <React/RCTLog.h>
#import <glog/logging.h>

namespace facebook::react {

void RCTDefaultCxxLogFunction(ReactNativeLogLevel level, const char *message)
{
  NSString *messageString = [NSString stringWithUTF8String:message];

  switch (level) {
    case ReactNativeLogLevelInfo:
      LOG(INFO) << message;
      RCTLogInfo(@"%@", messageString);
      break;
    case ReactNativeLogLevelWarning:
      LOG(WARNING) << message;
      RCTLogWarn(@"%@", messageString);
      break;
    case ReactNativeLogLevelError:
      LOG(ERROR) << message;
      RCTLogError(@"%@", messageString);
      break;
    case ReactNativeLogLevelFatal:
      LOG(FATAL) << message;
      break;
  }
}

} // namespace facebook::react
