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

#include <exception>

#include <folly/CPortability.h>
#include <folly/CppAttributes.h>
#include <folly/Portability.h>

namespace folly {

/// throw_exception
///
/// Throw an exception if exceptions are enabled, or terminate if compiled with
/// -fno-exceptions.
template <typename Ex>
[[noreturn]] FOLLY_NOINLINE FOLLY_COLD void throw_exception(Ex&& ex) {
#if FOLLY_HAS_EXCEPTIONS
  throw static_cast<Ex&&>(ex);
#else
  (void)ex;
  std::terminate();
#endif
}

/// terminate_with
///
/// Terminates as if by forwarding to throw_exception but in a noexcept context.
template <typename Ex>
[[noreturn]] FOLLY_NOINLINE FOLLY_COLD void terminate_with(Ex&& ex) noexcept {
  throw_exception(static_cast<Ex&&>(ex));
}

// clang-format off
namespace detail {
template <typename T>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN T&& to_exception_arg_(T&& t) {
  return static_cast<T&&>(t);
}
template <std::size_t N>
FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN char const* to_exception_arg_(
    char const (&array)[N]) {
  return static_cast<char const*>(array);
}
template <typename Ex, typename... Args>
[[noreturn]] FOLLY_NOINLINE FOLLY_COLD void throw_exception_(Args&&... args) {
  throw_exception(Ex(static_cast<Args&&>(args)...));
}
template <typename Ex, typename... Args>
[[noreturn]] FOLLY_NOINLINE FOLLY_COLD void terminate_with_(
    Args&&... args) noexcept {
  throw_exception(Ex(static_cast<Args&&>(args)...));
}
} // namespace detail
// clang-format on

/// throw_exception
///
/// Construct and throw an exception if exceptions are enabled, or terminate if
/// compiled with -fno-exceptions.
///
/// Converts any arguments of type `char const[N]` to `char const*`.
template <typename Ex, typename... Args>
[[noreturn]] FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN void
throw_exception(Args&&... args) {
  detail::throw_exception_<Ex>(
      detail::to_exception_arg_(static_cast<Args&&>(args))...);
}

/// terminate_with
///
/// Terminates as if by forwarding to throw_exception but in a noexcept context.
// clang-format off
template <typename Ex, typename... Args>
[[noreturn]] FOLLY_ALWAYS_INLINE FOLLY_ATTR_VISIBILITY_HIDDEN void
terminate_with(Args&&... args) noexcept {
  detail::terminate_with_<Ex>(
      detail::to_exception_arg_(static_cast<Args&&>(args))...);
}
// clang-format on

/// invoke_noreturn_cold
///
/// Invoke the provided function with the provided arguments. If the invocation
/// returns, terminate.
///
/// May be used with throw_exception in cases where construction of the object
/// to be thrown requires more than just invoking its constructor with a given
/// sequence of arguments passed by reference - for example, if a string message
/// must be computed before being passed to the constructor of the object to be
/// thrown.
///
/// Usage note:
/// Passing extra values as arguments rather than capturing them allows smaller
/// bytecode at the call-site.
///
/// Example:
///
///   if (i < 0) {
///     invoke_noreturn_cold(
///         [](int j) {
///           throw_exceptions(runtime_error(to<string>("invalid: ", j)));
///         },
///         i);
///   }
template <typename F, typename... A>
[[noreturn]] FOLLY_NOINLINE FOLLY_COLD void invoke_noreturn_cold(
    F&& f,
    A&&... a) {
  static_cast<F&&>(f)(static_cast<A&&>(a)...);
  std::terminate();
}

} // namespace folly
