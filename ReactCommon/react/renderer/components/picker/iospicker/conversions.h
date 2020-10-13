/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <react/renderer/components/iospicker/primitives.h>

#include <vector>

namespace facebook {
namespace react {

inline void fromRawValue(
    const RawValue &value,
    std::vector<PickerItemsStruct> &items) {
  auto array = (folly::dynamic)value;
  for (auto itr = array.begin(); itr != array.end(); ++itr) {
    // TODO (T75217510) - Use the itr to create the item instead of using these
    // dummy values.
    struct PickerItemsStruct item = {
        .label = "LOL", .value = "LOL2", .textColor = 0};
    items.push_back(item);
  }
}

} // namespace react
} // namespace facebook
