/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTCxxExceptionManager.h"

#import <Foundation/Foundation.h>

#import <React/RCTBridge.h>
#import <React/RCTBridge+Private.h>
#import <React/RCTExceptionsManager.h>
#import <React/RCTLog.h>

namespace facebook {
namespace react {

void RCTCxxExceptionManager::handleSoftException(const std::exception& e) const {
  RCTExceptionsManager *manager = [[RCTBridge currentBridge] moduleForClass:[RCTExceptionsManager class]];
  [manager reportSoftException:[NSString stringWithUTF8String:e.what()] stack:RCT_CALLSTACK exceptionId:@0];
}

void RCTCxxExceptionManager::handleFatalException(const std::exception& e) const {
  RCTExceptionsManager *manager = [[RCTBridge currentBridge] moduleForClass:[RCTExceptionsManager class]];
  [manager reportFatalException:[NSString stringWithUTF8String:e.what()] stack:RCT_CALLSTACK exceptionId:@0];
}

} // namespace react
} // namespace facebook
