/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#include "DynamicPropsUtilities.h"

namespace facebook::react {

folly::dynamic mergeDynamicProps(
    const folly::dynamic& source,
    const folly::dynamic& patch,
    NullValueStrategy nullValueStrategy) {
  auto result = source;

  if (!result.isObject()) {
    result = folly::dynamic::object();
  }

  if (!patch.isObject()) {
    return result;
  }

  // Note, here we have to preserve sub-prop objects with `null` value as
  // an indication for the legacy mounting layer that it needs to clean them up.
  for (const auto& pair : patch.items()) {
    if (nullValueStrategy == NullValueStrategy::Ignore &&
        source.find(pair.first) == source.items().end()) {
      continue;
    }
    result[pair.first] = pair.second;
  }

  return result;
}

folly::dynamic diffDynamicProps(
    const folly::dynamic& oldProps,
    const folly::dynamic& newProps) {
  folly::dynamic result = folly::dynamic::object();
  if (!oldProps.isObject() || !newProps.isObject()) {
    return result;
  }
  for (const auto& oldPair : oldProps.items()) {
    const auto& newIterator = newProps.find(oldPair.first);
    if (newIterator == newProps.items().end()) {
      // Prop removed.
      result[oldPair.first] = nullptr;
    } else if (oldPair.second != newIterator->second) {
      // Prop changed.
      result[oldPair.first] = newIterator->second;
    }
  }
  for (const auto& newIterator : newProps.items()) {
    if (oldProps.find(newIterator.first) == oldProps.items().end()) {
      // Prop added.
      result[newIterator.first] = newIterator.second;
    }
  }
  return result;
}

} // namespace facebook::react
