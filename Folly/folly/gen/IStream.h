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
#pragma once

#include <istream>
#include <string>

#include <folly/gen/Core.h>

namespace folly {
namespace gen {
namespace detail {

/**
 * Generates lines by calling std::getline() on a given istream.
 */
class IStreamByLine : public GenImpl<std::string&&, IStreamByLine> {
 public:
  IStreamByLine(std::istream& in) : in_(in) {}

  template <class Body>
  bool apply(Body&& body) const {
    for (std::string line; std::getline(in_, line);) {
      if (!body(std::move(line))) {
        return false;
      }
    }
    return true;
  }

  // Technically, there could be infinite files (e.g. /dev/random), but people
  // who open those can do so at their own risk.
  static constexpr bool infinite = false;

 private:
  std::istream& in_;
};

} // namespace detail

inline detail::IStreamByLine byLine(std::istream& in) {
  return detail::IStreamByLine(in);
}

} // namespace gen
} // namespace folly
