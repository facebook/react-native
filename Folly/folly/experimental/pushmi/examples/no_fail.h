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

#include <folly/experimental/pushmi/o/submit.h>
#include <folly/experimental/pushmi/single_sender.h>

namespace pushmi {

namespace detail {

struct no_fail_fn {
 private:
  struct on_error_impl {
    [[noreturn]] void operator()(any, any) noexcept {
      std::abort();
    }
  };
  template <class In>
  struct out_impl {
    PUSHMI_TEMPLATE(class Out)
    (requires Receiver<Out>)auto operator()(Out out) const {
      return ::pushmi::detail::receiver_from_fn<In>()(
          std::move(out), ::pushmi::on_error(on_error_impl{}));
    }
  };
  struct in_impl {
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>)auto operator()(In in) const {
      return ::pushmi::detail::sender_from(
          std::move(in),
          ::pushmi::detail::submit_transform_out<In>(out_impl<In>{}));
    }
  };

 public:
  auto operator()() const {
    return in_impl{};
  }
};

} // namespace detail

namespace operators {
PUSHMI_INLINE_VAR constexpr detail::no_fail_fn no_fail{};
} // namespace operators

} // namespace pushmi
