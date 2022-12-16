/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#if __has_include(<source_location>) && __cplusplus >= 202002L
#include <source_location>
#elif __has_include(<experimental/source_location>)
#include <experimental/source_location>
namespace std {
using source_location = ::std::experimental::source_location;
} // namespace std
#else
#include <cstdint>

namespace std {
struct source_location {
  constexpr source_location() noexcept
      : file_(nullptr), function_(nullptr), line_(0), column_(0) {}
  static source_location current(
      const char *file = __builtin_FILE(),
      const char *function = __builtin_FUNCTION(),
      uint_least32_t line = __builtin_LINE(),
      uint_least32_t column = __builtin_COLUMN()) {
    return {file, function, line, column};
  }
  constexpr uint_least32_t line() const noexcept {
    return line_;
  }
  constexpr uint_least32_t column() const noexcept {
    return column_;
  }
  constexpr const char *file_name() const noexcept {
    return file_;
  }
  constexpr const char *function_name() const noexcept {
    return function_;
  }

 private:
  constexpr source_location(
      const char *file,
      const char *function,
      uint_least32_t line,
      uint_least32_t column) noexcept
      : file_(file), function_(function), line_(line), column_(column) {}

  const char *file_;
  const char *function_;
  uint_least32_t line_;
  uint_least32_t column_;
};
} // namespace std
#endif
