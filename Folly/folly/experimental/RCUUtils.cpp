/*
 * Copyright 2017 Facebook, Inc.
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
#include <folly/experimental/RCUUtils.h>

#include <folly/ThreadLocal.h>

namespace folly {

namespace {

struct RCURegisterThreadHelper {
  RCURegisterThreadHelper() {
    rcu_register_thread();
  }

  ~RCURegisterThreadHelper() {
    rcu_unregister_thread();
  }

  bool alive{false};
};

}

bool RCURegisterThread() {
  static folly::ThreadLocal<RCURegisterThreadHelper>* rcuRegisterThreadHelper =
    new folly::ThreadLocal<RCURegisterThreadHelper>();

  auto& helper = **rcuRegisterThreadHelper;

  auto ret = !helper.alive;
  helper.alive = true;

  return ret;
}

RCUReadLock& RCUReadLock::instance() {
  // Both lock and unlock are static, so no need to worry about destruction
  // order
  static RCUReadLock instance;
  return instance;
}
}
