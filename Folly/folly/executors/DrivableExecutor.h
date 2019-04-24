/*
 * Copyright 2015-present Facebook, Inc.
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

#include <folly/Executor.h>

namespace folly {

/*
 * A DrivableExecutor can be driven via its drive() method
 * Examples include EventBase (via loopOnce()) and ManualExecutor
 * (via makeProgress()).
 *
 * This interface is most handy in conjunction with
 * Future<T>::getVia(DrivableExecutor*) and
 * Future<T>::waitVia(DrivableExecutor*)
 *
 * These call drive() * repeatedly until the Future is fulfilled.
 * getVia() returns the value (or throws the exception) and waitVia() returns
 * the same Future for chainability.
 *
 * These will be most helpful in tests, for instance if you need to pump a mock
 * EventBase until Futures complete.
 */

class DrivableExecutor : public virtual Executor {
 public:
  ~DrivableExecutor() override = default;

  // Make progress on this Executor's work.
  //
  // Drive *must not* busy wait if there is no work to do.  Instead,
  // sleep (using a semaphore or similar) until at least one event is
  // processed.
  // I.e. make_future().via(foo).then(...).getVia(DrivableExecutor)
  // must not spin, even though nothing happens on the drivable
  // executor.
  virtual void drive() = 0;
};

} // namespace folly
