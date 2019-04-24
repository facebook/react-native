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

#include <functional>

#include <folly/experimental/pushmi/detail/concept_def.h>

namespace pushmi {

PUSHMI_INLINE_VAR constexpr struct invoke_fn {
 private:
  template <class F>
  using mem_fn_t = decltype(std::mem_fn(std::declval<F>()));

 public:
  template <class F, class... As>
  auto operator()(F&& f, As&&... as) const
      noexcept(noexcept(((F &&) f)((As &&) as...)))
          -> decltype(((F &&) f)((As &&) as...)) {
    return ((F &&) f)((As &&) as...);
  }
  template <class F, class... As>
  auto operator()(F&& f, As&&... as) const
      noexcept(noexcept(std::declval<mem_fn_t<F>>()((As &&) as...)))
          -> decltype(std::mem_fn(f)((As &&) as...)) {
    return std::mem_fn(f)((As &&) as...);
  }
} invoke{};

template <class F, class... As>
using invoke_result_t =
    decltype(pushmi::invoke(std::declval<F>(), std::declval<As>()...));

PUSHMI_CONCEPT_DEF(
  template (class F, class... Args)
  (concept Invocable)(F, Args...),
    requires(F&& f) (
      pushmi::invoke((F &&) f, std::declval<Args>()...)
    )
);

PUSHMI_CONCEPT_DEF(
  template (class F, class... Args)
  (concept NothrowInvocable)(F, Args...),
    requires(F&& f) (
      requires_<noexcept(pushmi::invoke((F &&) f, std::declval<Args>()...))>
    ) &&
    Invocable<F, Args...>
);

} // namespace pushmi
