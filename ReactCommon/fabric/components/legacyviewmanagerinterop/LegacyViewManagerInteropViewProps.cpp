/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "LegacyViewManagerInteropViewProps.h"
#include <folly/json.h>
#include <react/core/propsConversions.h>
#include <iostream>

namespace facebook {
namespace react {

static std::unordered_map<std::string, folly::dynamic> convertToMap(
    RawProps const &rawProps) {
  std::unordered_map<std::string, folly::dynamic> map{};
  auto const dynamic = (folly::dynamic)rawProps;
  if (dynamic.isObject()) {
    for (auto const &t : dynamic.items()) {
      if (t.first.isString()) {
        map[t.first.asString()] = t.second;
      }
    }
  }
  return map;
}

LegacyViewManagerInteropViewProps::LegacyViewManagerInteropViewProps(
    const LegacyViewManagerInteropViewProps &sourceProps,
    const RawProps &rawProps)
    : ViewProps(sourceProps, rawProps), otherProps(convertToMap(rawProps)) {}

} // namespace react
} // namespace facebook
