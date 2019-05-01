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

namespace pushmi {

class inline_constrained_executor_t {
 public:
  using properties = property_set<
      is_constrained<>,
      is_executor<>,
      is_always_blocking<>,
      is_fifo_sequence<>,
      is_single<>>;

  std::ptrdiff_t top() {
    return 0;
  }
  auto executor() {
    return *this;
  }
  PUSHMI_TEMPLATE(class CV, class Out)
  (requires Regular<CV>&& Receiver<Out>)void submit(CV, Out out) {
    ::pushmi::set_value(out, *this);
    ::pushmi::set_done(out);
  }
};

struct inlineConstrainedEXF {
  inline_constrained_executor_t operator()() {
    return {};
  }
};

inline inline_constrained_executor_t inline_constrained_executor() {
  return {};
}

class inline_time_executor_t {
 public:
  using properties = property_set<
      is_time<>,
      is_executor<>,
      is_always_blocking<>,
      is_fifo_sequence<>,
      is_single<>>;

  auto top() {
    return std::chrono::system_clock::now();
  }
  auto executor() {
    return *this;
  }
  PUSHMI_TEMPLATE(class TP, class Out)
  (requires Regular<TP>&& Receiver<Out>)void submit(TP tp, Out out) {
    std::this_thread::sleep_until(tp);
    ::pushmi::set_value(out, *this);
    ::pushmi::set_done(out);
  }
};

struct inlineTimeEXF {
  inline_time_executor_t operator()() {
    return {};
  }
};

inline inline_time_executor_t inline_time_executor() {
  return {};
}

class inline_executor_t {
 public:
  using properties = property_set<
      is_sender<>,
      is_executor<>,
      is_always_blocking<>,
      is_fifo_sequence<>,
      is_single<>>;

  auto executor() {
    return *this;
  }
  PUSHMI_TEMPLATE(class Out)
  (requires Receiver<Out>)void submit(Out out) {
    ::pushmi::set_value(out, *this);
    ::pushmi::set_done(out);
  }
};

struct inlineEXF {
  inline_executor_t operator()() {
    return {};
  }
};

inline inline_executor_t inline_executor() {
  return {};
}

} // namespace pushmi
