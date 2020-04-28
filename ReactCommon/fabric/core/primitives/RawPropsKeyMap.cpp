/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "RawPropsKeyMap.h"

#include <cassert>
#include <cstdlib>
#include <cstring>

namespace facebook {
namespace react {

int RawPropsKeyMap::comparator(void const *lhs, void const *rhs) {
  auto a = static_cast<RawPropsKeyMap::Item const *>(lhs);
  auto b = static_cast<RawPropsKeyMap::Item const *>(rhs);

  if (a->length != b->length) {
    return a->length - b->length;
  }

  return std::memcmp(a->name, b->name, a->length);
}

void RawPropsKeyMap::insert(RawPropsKey const &key, RawPropsValueIndex value) {
  auto item = Item{};
  item.value = value;
  key.render(item.name, &item.length);
  items_.push_back(item);
}

void RawPropsKeyMap::reindex() {
  // Sorting `items_` by property names length and then lexicographically.
  std::qsort(
      items_.data(),
      items_.size(),
      sizeof(decltype(items_)::value_type),
      &RawPropsKeyMap::comparator);

  buckets_.resize(kPropNameLengthHardCap);

  auto length = RawPropsPropNameLength{0};
  for (auto i = 0; i < items_.size(); i++) {
    auto &item = items_[i];
    if (item.length != length) {
      for (auto j = length; j < item.length; j++) {
        buckets_[j] = i;
      }
      length = item.length;
    }
  }

  for (auto j = length; j < buckets_.size(); j++) {
    buckets_[j] = items_.size();
  }
}

RawPropsValueIndex RawPropsKeyMap::at(
    char const *name,
    RawPropsPropNameLength length) {
  assert(length > 0);
  assert(length < kPropNameLengthHardCap);
  // 1. Find the bucket.
  auto lower = int{buckets_[length - 1]};
  auto upper = int{buckets_[length]} - 1;
  assert(lower - 1 <= upper);

  // 2. Binary search in the bucket.
  while (lower <= upper) {
    auto median = (lower + upper) / 2;
    auto condition = std::memcmp(items_[median].name, name, length);
    if (condition < 0) {
      lower = median + 1;
    } else if (condition == 0) {
      return items_[median].value;
    } else /* if (condition > 0) */ {
      upper = median - 1;
    }
  }

  return kRawPropsValueIndexEmpty;
}

} // namespace react
} // namespace facebook
