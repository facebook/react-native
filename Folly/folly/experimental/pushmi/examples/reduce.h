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

PUSHMI_INLINE_VAR constexpr struct reduce_fn {
 private:
  template <class BinaryOp>
  struct fn {
    BinaryOp binary_op_;
    template <class Acc, class Cursor>
    void operator()(Acc& acc, Cursor cursor) const {
      acc = binary_op_(acc, *cursor);
    }
  };
  struct identity {
    template <class T>
    auto operator()(T&& t) const {
      return (T &&) t;
    }
  };

 public:
  template <class ExecutionPolicy, class ForwardIt, class T, class BinaryOp>
  T operator()(
      ExecutionPolicy&& policy,
      ForwardIt begin,
      ForwardIt end,
      T init,
      BinaryOp binary_op) const {
    return operators::just(std::move(init)) |
        operators::bulk(
               fn<BinaryOp>{binary_op},
               begin,
               end,
               policy,
               identity{},
               identity{}) |
        operators::get<T>;
  }
} reduce{};

} // namespace pushmi
