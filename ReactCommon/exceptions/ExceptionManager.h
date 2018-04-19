/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <exception>

namespace facebook {
namespace react {

/**
 * An abstract class for C++-based exception handling that differentiates
 * soft exceptions from fatal exceptions.
 */
class ExceptionManager {
public:
  virtual ~ExceptionManager() = default;

  virtual void handleSoftException(const std::exception &e) const = 0;
  virtual void handleFatalException(const std::exception &e) const = 0;
};

} // namespace react
} // namespace facebook
