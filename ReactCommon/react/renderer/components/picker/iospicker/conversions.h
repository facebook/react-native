/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/debug/react_native_assert.h>
#include <react/renderer/components/iospicker/primitives.h>

#include <vector>

namespace facebook {
namespace react {

inline void fromRawValue(
    const RawValue &value,
    std::vector<PickerItemsStruct> &items) {
  react_native_assert(value.hasType<std::vector<RawValue>>());
  auto array = (std::vector<RawValue>)value;
  items.reserve(array.size());

  for (auto const &val : array) {
    bool check = val.hasType<better::map<std::string, RawValue>>();
    react_native_assert(check);
    auto map = (better::map<std::string, RawValue>)val;
    PickerItemsStruct item;

    if (map.find("label") != map.end()) {
      react_native_assert(map.at("label").hasType<std::string>());
      item.label = (std::string)map.at("label");
    }
    if (map.find("value") != map.end()) {
      react_native_assert(map.at("value").hasType<std::string>());
      item.value = (std::string)map.at("value");
    }
    if (map.find("textColor") != map.end()) {
      react_native_assert(map.at("textColor").hasType<int>());
      item.textColor = (int)map.at("textColor");
    }
    items.push_back(item);
  }
}

} // namespace react
} // namespace facebook
