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
#include <folly/experimental/pushmi/o/submit.h>
#include <folly/experimental/pushmi/o/via.h>
#include <folly/experimental/pushmi/receiver.h>

namespace pushmi {

template <typename In>
struct send_via {
  In in;
  PUSHMI_TEMPLATE(class... AN)
  (requires Invocable<decltype(::pushmi::operators::via), AN...>&& Invocable<
      invoke_result_t<decltype(::pushmi::operators::via), AN...>,
      In>)
  auto via(AN&&... an) {
    return in | ::pushmi::operators::via((AN &&) an...);
  }
};

namespace detail {

struct request_via_fn {
 private:
  struct impl {
    PUSHMI_TEMPLATE(class In)
    (requires Sender<In>)
    auto operator()(In in) const {
      return send_via<In>{in};
    }
  };

 public:
  inline auto operator()() const {
    return impl{};
  }
};

} // namespace detail

namespace operators {

PUSHMI_INLINE_VAR constexpr detail::request_via_fn request_via{};

} // namespace operators

PUSHMI_TEMPLATE(class To, class In)
(requires Same<To, is_sender<>>&& Sender<In>)
auto via_cast(In in) {
  return in;
}

PUSHMI_TEMPLATE(class To, class In)
(requires Same<To, is_sender<>>)
auto via_cast(send_via<In> ss) {
  return ss.in;
}

} // namespace pushmi
