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
#include <folly/experimental/pushmi/o/extension_operators.h>
#include <folly/experimental/pushmi/piping.h>

namespace pushmi {

namespace detail {

struct on_fn {
 private:
  template <class In, class Out>
  struct on_value_impl {
    In in_;
    Out out_;
    void operator()(any) {
      ::pushmi::submit(in_, std::move(out_));
    }
  };
  template <class In, class ExecutorFactory>
  struct out_impl {
    ExecutorFactory ef_;
    PUSHMI_TEMPLATE(class Out)
    (requires SenderTo<In, Out>)
    void operator()(In& in, Out out) const {
      auto exec = ef_();
      ::pushmi::submit(
          exec,
          ::pushmi::make_receiver(on_value_impl<In, Out>{in, std::move(out)}));
    }
  };
  template <class In, class TP, class Out>
  struct time_on_value_impl {
    In in_;
    TP at_;
    Out out_;
    void operator()(any) {
      ::pushmi::submit(in_, at_, std::move(out_));
    }
  };
  template <class In, class ExecutorFactory>
  struct time_out_impl {
    ExecutorFactory ef_;
    PUSHMI_TEMPLATE(class TP, class Out)
    (requires TimeSenderTo<In, Out>)
    void operator()(In& in, TP at, Out out) const {
      auto exec = ef_();
      ::pushmi::submit(
          exec,
          at,
          ::pushmi::make_receiver(
              time_on_value_impl<In, TP, Out>{in, at, std::move(out)}));
    }
  };
  template <class ExecutorFactory>
  struct in_impl {
    ExecutorFactory ef_;
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>)
    auto operator()(In in) const {
      return ::pushmi::detail::sender_from(
          std::move(in),
          detail::submit_transform_out<In>(
              out_impl<In, ExecutorFactory>{ef_},
              time_out_impl<In, ExecutorFactory>{ef_}));
    }
  };

 public:
  PUSHMI_TEMPLATE(class ExecutorFactory)
  (requires Invocable<ExecutorFactory&>&&
       Executor<invoke_result_t<ExecutorFactory&>>)
  auto operator()(ExecutorFactory ef) const {
    return in_impl<ExecutorFactory>{std::move(ef)};
  }
};

} // namespace detail

namespace operators {

PUSHMI_INLINE_VAR constexpr detail::on_fn on{};

} // namespace operators

} // namespace pushmi
