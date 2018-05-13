/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "debugStringConvertibleUtils.h"

namespace facebook {
namespace react {

SharedDebugStringConvertibleList operator+(const SharedDebugStringConvertibleList &lhs, const SharedDebugStringConvertibleList &rhs) {
  SharedDebugStringConvertibleList result = {};
  std::move(lhs.begin(), lhs.end(), std::back_inserter(result));
  std::move(rhs.begin(), rhs.end(), std::back_inserter(result));
  return result;
}

SharedDebugStringConvertible debugStringConvertibleItem(std::string name, DebugStringConvertible value, std::string defaultValue) {
  return debugStringConvertibleItem(name, value.getDebugDescription(), defaultValue);
}

} // namespace react
} // namespace facebook
