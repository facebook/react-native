/*
 * Copyright 2016-present Facebook, Inc.
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

/**
 * `Shell` provides a collection of functions to use with `Subprocess` that make
 * it easier to safely run processes in a unix shell.
 *
 * Note: use this rarely and carefully. By default you should use `Subprocess`
 * with a vector of arguments.
 */

#pragma once

#include <string>
#include <vector>

#include <folly/Conv.h>
#include <folly/Format.h>
#include <folly/Range.h>

namespace folly {

/**
 * Quotes an argument to make it suitable for use as shell command arguments.
 */
std::string shellQuote(StringPiece argument);

namespace detail {
template <typename... Arguments>
std::vector<std::string> shellify(
    StringPiece format,
    Arguments&&... arguments) {
  auto command = sformat(
      format,
      shellQuote(to<std::string>(std::forward<Arguments>(arguments)))...);
  return {"/bin/sh", "-c", command};
}

struct ShellCmdFormat {
  StringPiece format;
  template <typename... Arguments>
  std::vector<std::string> operator()(Arguments&&... arguments) const {
    return ::folly::detail::shellify(
        format, std::forward<Arguments>(arguments)...);
  }
};

} // namespace detail

inline namespace literals {
inline namespace shell_literals {
constexpr detail::ShellCmdFormat operator"" _shellify(
    char const* name,
    std::size_t length) {
  return {folly::StringPiece(name, length)};
}
} // namespace shell_literals
} // namespace literals

/**
 * Create argument array for `Subprocess()` for a process running in a
 * shell.
 *
 * The shell to use is always going to be `/bin/sh`.
 *
 * This is deprecated in favour of the user-defined-literal `_shellify`
 * from namespace `folly::shell_literals` because that requires that the format
 * string is a compile-time constant which can be inspected during code reviews
 */
// clang-format off
template <typename... Arguments>
[[deprecated(
    "Use `\"command {} {} ...\"_shellify(argument1, argument2 ...)` from "
    "namespace `folly::literals::shell_literals`")]]
std::vector<std::string> shellify(
    StringPiece format,
    Arguments&&... arguments) {
  return detail::shellify(format, std::forward<Arguments>(arguments)...);
}
// clang-format on

} // namespace folly
