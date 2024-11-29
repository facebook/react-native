/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTJSThread.h"

dispatch_queue_t RCTJSThread;

void _RCTInitializeJSThreadConstantInternal(void)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    // Set up JS thread
    RCTJSThread = (id)kCFNull;
  });
}
