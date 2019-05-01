/*
 * Copyright 2018-present Facebook, Inc.
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

#include <folly/python/fibers.h>
#include <folly/fibers/CallOnce.h>
#include <folly/python/fiber_manager_api.h>

namespace folly {
namespace python {

folly::fibers::FiberManager* getFiberManager(
    const folly::fibers::FiberManager::Options& opts) {
  static folly::fibers::once_flag flag;
  // Use call_once because Python performance is really poor,
  // just to check if a module was already imported
  folly::call_once(flag, [&]() {
    // Use main context, because import can load arbitrary number of files,
    // which is incompatible with fiber stack size restrictions
    folly::fibers::runInMainContext([&]() {
      import_folly__fiber_manager();
      if (PyErr_Occurred() != nullptr) {
        throw std::logic_error("Fail to import cython fiber_manager");
      }
    });
  });
  return get_fiber_manager(opts);
}

} // namespace python
} // namespace folly
