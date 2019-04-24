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

#include <folly/experimental/pushmi/examples/bulk.h>
#include <folly/experimental/pushmi/o/just.h>
#include <folly/experimental/pushmi/o/submit.h>

namespace pushmi {

PUSHMI_INLINE_VAR constexpr struct for_each_fn {
 private:
  template <class Function>
  struct fn {
    Function f_;
    template <class Cursor>
    void operator()(detail::any, Cursor cursor) const {
      f_(*cursor);
    }
  };
  struct identity {
    template <class T>
    auto operator()(T&& t) const {
      return (T &&) t;
    }
  };
  struct zero {
    int operator()(detail::any) const noexcept {
      return 0;
    }
  };

 public:
  template <class ExecutionPolicy, class RandomAccessIterator, class Function>
  void operator()(
      ExecutionPolicy&& policy,
      RandomAccessIterator begin,
      RandomAccessIterator end,
      Function f) const {
    operators::just(0) |
        operators::bulk(
            fn<Function>{f}, begin, end, policy, identity{}, zero{}) |
        operators::blocking_submit();
  }
} for_each{};

} // namespace pushmi
