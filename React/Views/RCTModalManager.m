/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "RCTModalManager.h"

@interface RCTModalManager ()

@property BOOL shouldEmit;

@end

@implementation RCTModalManager

RCT_EXPORT_MODULE();

- (NSArray<NSString *> *)supportedEvents
{
  return @[ @"modalDismissed" ];
}

- (void)startObserving
{
  _shouldEmit = YES;
}

- (void)stopObserving
{
  _shouldEmit = NO;
}

- (void)modalDismissed:(NSNumber *)modalID
{
  if (_shouldEmit) {
    [self sendEventWithName:@"modalDismissed" body:@{@"modalID" : modalID}];
  }
}

@end
