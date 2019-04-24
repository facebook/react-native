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

#include <folly/experimental/pushmi/o/extension_operators.h>
#include <folly/experimental/pushmi/piping.h>

namespace pushmi {

namespace detail {

struct switch_on_error_fn {
 private:
  template <class ErrorSelector>
  struct on_error_impl {
    ErrorSelector es_;
    PUSHMI_TEMPLATE(class Out, class E)
    (requires Receiver<Out>&& Invocable<const ErrorSelector&, E>&&
         SenderTo<pushmi::invoke_result_t<ErrorSelector&, E>, Out>)
    void operator()(Out& out, E&& e) const noexcept {
      static_assert(
          ::pushmi::NothrowInvocable<const ErrorSelector&, E>,
          "switch_on_error - error selector function must be noexcept");
      auto next = es_((E &&) e);
      ::pushmi::submit(next, out);
    }
  };
  template <class In, class ErrorSelector>
  struct out_impl {
    ErrorSelector es_;
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)
    auto operator()(Out out) const {
      return ::pushmi::detail::receiver_from_fn<In>()(
          std::move(out),
          // copy 'es' to allow multiple calls to submit
          ::pushmi::on_error(on_error_impl<ErrorSelector>{es_}));
    }
  };
  template <class ErrorSelector>
  struct in_impl {
    ErrorSelector es_;
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>)
    auto operator()(In in) const {
      return ::pushmi::detail::sender_from(
          std::move(in),
          ::pushmi::detail::submit_transform_out<In>(
              out_impl<In, ErrorSelector>{es_}));
    }
  };

 public:
  PUSHMI_TEMPLATE(class ErrorSelector)
  (requires SemiMovable<ErrorSelector>)
  auto operator()(ErrorSelector es) const {
    return in_impl<ErrorSelector>{std::move(es)};
  }
};

} // namespace detail

namespace operators {
PUSHMI_INLINE_VAR constexpr detail::switch_on_error_fn switch_on_error{};
} // namespace operators

} // namespace pushmi
