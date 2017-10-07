/**
 * Copyright (c) 2015-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 */

#import "RCTUIManagerUtils.h"

#import "RCTAssert.h"

char *const RCTUIManagerQueueName = "com.facebook.react.ShadowQueue";

dispatch_queue_t RCTGetUIManagerQueue(void)
{
  static dispatch_queue_t shadowQueue;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    if ([NSOperation instancesRespondToSelector:@selector(qualityOfService)]) {
      dispatch_queue_attr_t attr = dispatch_queue_attr_make_with_qos_class(DISPATCH_QUEUE_SERIAL, QOS_CLASS_USER_INTERACTIVE, 0);
      shadowQueue = dispatch_queue_create(RCTUIManagerQueueName, attr);
    } else {
      shadowQueue = dispatch_queue_create(RCTUIManagerQueueName, DISPATCH_QUEUE_SERIAL);
      dispatch_set_target_queue(shadowQueue, dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_HIGH, 0));
    }
  });
  return shadowQueue;
}

BOOL RCTIsUIManagerQueue()
{
  static void *queueKey = &queueKey;
  static dispatch_once_t onceToken;
  dispatch_once(&onceToken, ^{
    dispatch_queue_set_specific(RCTGetUIManagerQueue(), queueKey, queueKey, NULL);
  });
  return dispatch_get_specific(queueKey) == queueKey;
}

void RCTExecuteOnUIManagerQueue(dispatch_block_t block)
{
  if (RCTIsUIManagerQueue()) {
    block();
  } else {
    dispatch_async(RCTGetUIManagerQueue(), ^{
      block();
    });
  }
}

void RCTUnsafeExecuteOnUIManagerQueueSync(dispatch_block_t block)
{
  if (RCTIsUIManagerQueue()) {
    block();
  } else {
    dispatch_sync(RCTGetUIManagerQueue(), ^{
      block();
    });
  }
}
