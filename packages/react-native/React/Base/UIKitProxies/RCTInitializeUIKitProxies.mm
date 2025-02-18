/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTInitializeUIKitProxies.h"
#import "RCTWindowSafeAreaProxy.h"

void RCTInitializeUIKitProxies(void)
{
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    [[RCTWindowSafeAreaProxy sharedInstance] startObservingSafeArea];
  });
}
