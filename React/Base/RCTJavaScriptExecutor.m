/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTJavaScriptExecutor.h"


static const char *RCTJavaScriptExecutorID = "RCTJavaScriptExecutorID";

void RCTSetExecutorID(id<RCTJavaScriptExecutor> executor)
{
  static NSUInteger executorID = 0;
  if (executor) {
    objc_setAssociatedObject(executor, RCTJavaScriptExecutorID, @(++executorID), OBJC_ASSOCIATION_RETAIN);
  }
}

NSNumber *RCTGetExecutorID(id<RCTJavaScriptExecutor> executor)
{
  return executor ? objc_getAssociatedObject(executor, RCTJavaScriptExecutorID) : @0;
}
