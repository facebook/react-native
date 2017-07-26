// Copyright 2004-present Facebook. All Rights Reserved.

#pragma once

#include <exception>
#include <functional>
#include <string>

namespace facebook {
namespace react {

/**
 * RecoverableError
 *
 * An exception that it is expected we should be able to recover from.
 */
struct RecoverableError : public std::exception {

  explicit RecoverableError(const std::string &what_)
    : m_what { "facebook::react::Recoverable: " + what_ }
  {}

  virtual const char* what() const throw() override { return m_what.c_str(); }

  /**
   * runRethrowingAsRecoverable
   *
   * Helper function that converts any exception of type `E`, thrown within the
   * `act` routine into a recoverable error with the same message.
   */
  template <typename E>
  inline static void runRethrowingAsRecoverable(std::function<void()> act) {
    try {
      act();
    } catch(const E &err) {
      throw RecoverableError(err.what());
    }
  }

private:
  std::string m_what;
};

} // namespace react
} // namespace facebook
