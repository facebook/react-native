/*
 * Copyright 2017 Facebook, Inc.
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

#pragma once

#include <folly/Traits.h>

namespace folly {

FOLLY_CREATE_HAS_MEMBER_FN_TRAITS(container_emplace_back_traits, emplace_back);

template <class Container, typename... Args>
inline
typename std::enable_if<
    container_emplace_back_traits<Container, void(Args...)>::value>::type
container_emplace_back_or_push_back(Container& container, Args&&... args) {
  container.emplace_back(std::forward<Args>(args)...);
}

template <class Container, typename... Args>
inline
typename std::enable_if<
    !container_emplace_back_traits<Container, void(Args...)>::value>::type
container_emplace_back_or_push_back(Container& container, Args&&... args) {
  using v = typename Container::value_type;
  container.push_back(v(std::forward<Args>(args)...));
}

}
