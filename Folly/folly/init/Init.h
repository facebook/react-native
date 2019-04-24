/*
 * Copyright 2016-present Facebook, Inc.
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

#include <folly/CPortability.h>

/*
 * Calls common init functions in the necessary order
 * Among other things, this ensures that folly::Singletons are initialized
 * correctly and installs signal handlers for a superior debugging experience.
 * It also initializes gflags and glog.
 *
 * @param argc, argv   arguments to your main
 * @param removeFlags  if true, will update argc,argv to remove recognized
 *                     gflags passed on the command line
 */
namespace folly {

void init(int* argc, char*** argv, bool removeFlags = true);

/*
 * An RAII object to be constructed at the beginning of main() and destructed
 * implicitly at the end of main().
 *
 * The constructor performs the same setup as folly::init(), including
 * initializing singletons managed by folly::Singleton.
 *
 * The destructor destroys all singletons managed by folly::Singleton, yielding
 * better shutdown behavior when performed at the end of main(). In particular,
 * this guarantees that all singletons managed by folly::Singleton are destroyed
 * before all Meyers singletons are destroyed.
 */
class Init {
 public:
  // Force ctor & dtor out of line for better stack traces even with LTO.
  FOLLY_NOINLINE Init(int* argc, char*** argv, bool removeFlags = true);
  FOLLY_NOINLINE ~Init();
};

} // namespace folly
