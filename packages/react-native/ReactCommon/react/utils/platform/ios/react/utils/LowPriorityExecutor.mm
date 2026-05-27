/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#import "LowPriorityExecutor.h"

#import <Foundation/Foundation.h>

namespace facebook::react::LowPriorityExecutor {

void execute(std::function<void()> &&workItem)
{
  std::function<void()> localWorkItem = std::move(workItem);
  dispatch_async(dispatch_get_global_queue(DISPATCH_QUEUE_PRIORITY_LOW, 0), ^{
    localWorkItem();
  });
}

} // namespace facebook::react::LowPriorityExecutor
