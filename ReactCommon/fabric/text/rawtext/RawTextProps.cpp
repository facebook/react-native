/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawTextProps.h"

#include <fabric/core/propsConversions.h>
#include <fabric/debug/DebugStringConvertibleItem.h>

namespace facebook {
namespace react {

void RawTextProps::apply(const RawProps &rawProps) {
  Props::apply(rawProps);

  applyRawProp(rawProps, "text", text_);
}

#pragma mark - Getters

std::string RawTextProps::getText() const {
  return text_;
}

#pragma mark - DebugStringConvertible

SharedDebugStringConvertibleList RawTextProps::getDebugProps() const {
  SharedDebugStringConvertibleList list = {};
  list.push_back(std::make_shared<DebugStringConvertibleItem>("text", text_));
  return list;
}

} // namespace react
} // namespace facebook
