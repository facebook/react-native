/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <string>

namespace facebook {
namespace react {

/**
 * Provides mapping from old view name format to the new format.
 */
std::string componentNameByReactViewName(std::string viewName);

} // namespace react
} // namespace facebook
