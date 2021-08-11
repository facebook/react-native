/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <memory>
#include <string>

namespace facebook {
namespace react {
namespace ReactNativeLogger {

void info(std::string const &text);
void warning(std::string const &text);
void error(std::string const &text);

} // namespace ReactNativeLogger
} // namespace react
} // namespace facebook
