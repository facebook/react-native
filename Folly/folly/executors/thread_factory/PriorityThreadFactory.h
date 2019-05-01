/*
 * Copyright 2017-present Facebook, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

#pragma once

#include <folly/executors/thread_factory/ThreadFactory.h>

#include <folly/String.h>
#include <folly/portability/SysResource.h>
#include <folly/portability/SysTime.h>

namespace folly {

/**
 * A ThreadFactory that sets nice values for each thread.  The main
 * use case for this class is if there are multiple
 * CPUThreadPoolExecutors in a single process, or between multiple
 * processes, where some should have a higher priority than the others.
 *
 * Note that per-thread nice values are not POSIX standard, but both
 * pthreads and linux support per-thread nice.  The default linux
 * scheduler uses these values to do smart thread prioritization.
 * sched_priority function calls only affect real-time schedulers.
 */
class PriorityThreadFactory : public ThreadFactory {
 public:
  explicit PriorityThreadFactory(
      std::shared_ptr<ThreadFactory> factory,
      int priority)
      : factory_(std::move(factory)), priority_(priority) {}

  std::thread newThread(Func&& func) override {
    int priority = priority_;
    return factory_->newThread([priority, func = std::move(func)]() mutable {
      if (setpriority(PRIO_PROCESS, 0, priority) != 0) {
        LOG(ERROR) << "setpriority failed (are you root?) with error " << errno,
            errnoStr(errno);
      }
      func();
    });
  }

 private:
  std::shared_ptr<ThreadFactory> factory_;
  int priority_;
};

} // namespace folly
