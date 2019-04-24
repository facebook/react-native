#pragma once
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

#include <folly/experimental/pushmi/executor.h>
#include <folly/experimental/pushmi/trampoline.h>

namespace pushmi {

// very poor perf example executor.
//

struct new_thread_executor {
  using properties = property_set<
      is_sender<>,
      is_executor<>,
      is_never_blocking<>,
      is_concurrent_sequence<>,
      is_single<>>;

  new_thread_executor executor() {
    return {};
  }
  PUSHMI_TEMPLATE(class Out)
  (requires Receiver<Out>)
  void submit(Out out) {
    std::thread t{[out = std::move(out)]() mutable {
      auto tr = ::pushmi::trampoline();
      ::pushmi::submit(tr, std::move(out));
    }};
    // pass ownership of thread to out
    t.detach();
  }
};

inline new_thread_executor new_thread() {
  return {};
}

} // namespace pushmi
