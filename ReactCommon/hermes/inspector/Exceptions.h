// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

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

} // namespace inspector
} // namespace hermes
} // namespace facebook
