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

namespace pushmi {
namespace detail {
struct single_error_sender_base : single_sender<ignoreSF, inlineEXF> {
  using properties = property_set<
      is_sender<>,
      is_single<>,
      is_always_blocking<>,
      is_fifo_sequence<>>;
};
template <class E, class... VN>
struct single_error_impl {
  E e_;
  PUSHMI_TEMPLATE(class Out)
  (requires ReceiveError<Out, E>&& ReceiveValue<Out, VN...>)
  void operator()(
      single_error_sender_base&,
      Out out) {
    ::pushmi::set_error(out, std::move(e_));
  }
};
} // namespace detail

namespace operators {

PUSHMI_TEMPLATE(class... VN, class E)
(requires And<SemiMovable<VN>...>&& SemiMovable<E>)
auto error(E e) {
  return make_single_sender(
      detail::single_error_sender_base{},
      detail::single_error_impl<E, VN...>{std::move(e)});
}

} // namespace operators
} // namespace pushmi
