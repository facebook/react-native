/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

// using include guards instead of #pragma once due to compile issues
// with MSVC and BUCK
#ifndef HERMES_INSPECTOR_EXCEPTIONS_H
#define HERMES_INSPECTOR_EXCEPTIONS_H

#include <stdexcept>

namespace facebook {
namespace hermes {
namespace inspector {

class AlreadyEnabledException : public std::runtime_error {
 public:
  AlreadyEnabledException()
      : std::runtime_error("can't enable: debugger already enabled") {}
};

class NotEnabledException : public std::runtime_error {
 public:
  NotEnabledException(const std::string &cmd)
      : std::runtime_error("debugger can't perform " + cmd + ": not enabled") {}
};

class InvalidStateException : public std::runtime_error {
 public:
  InvalidStateException(
      const std::string &cmd,
      const std::string &curState,
      const std::string &expectedState)
      : std::runtime_error(
            "debugger can't perform " + cmd + ": in " + curState +
            ", expected " + expectedState) {}
};

class MultipleCommandsPendingException : public std::runtime_error {
 public:
  MultipleCommandsPendingException(const std::string &cmd)
      : std::runtime_error(
            "debugger can't perform " + cmd +
            ": a step or resume is already pending") {}
};

class UserCallbackException : public std::runtime_error {
 public:
  UserCallbackException(const std::exception &e)
      : std::runtime_error(std::string("callback exception: ") + e.what()) {}
};

} // namespace inspector
} // namespace hermes
} // namespace facebook

#endif // HERMES_INSPECTOR_EXCEPTIONS_H
