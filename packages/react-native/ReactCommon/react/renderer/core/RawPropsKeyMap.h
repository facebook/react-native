/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <butter/small_vector.h>

#include <react/renderer/core/RawPropsKey.h>
#include <react/renderer/core/RawPropsPrimitives.h>

namespace facebook {
namespace react {

/*
 * A map especially optimized to hold `{name: index}` relations.
 * The implementation is conceptually similar to a classic hash map with a hash
 * function that returns the length of the string.
 * The map is optimized for reads only (the map must be reindexed before a bunch
 * of reads).
 */
class RawPropsKeyMap final {
 public:
  /*
   * Stores `value` with by given `key`.
   */
  void insert(RawPropsKey const &key, RawPropsValueIndex value) noexcept;

  /*
   * Reindexes the stored data.
   * Must be called before `at` (after calling a bunch of `add`s).
   */
  void reindex() noexcept;

  /*
   * Finds and returns the `value` (some index) by given `key`.
   * Returns `kRawPropsValueIndexEmpty` if the value wan't found.
   */
  RawPropsValueIndex at(
      char const *name,
      RawPropsPropNameLength length) noexcept;

 private:
  struct Item {
    RawPropsValueIndex value;
    RawPropsPropNameLength length;
    char name[kPropNameLengthHardCap];
  };

  static bool shouldFirstOneBeBeforeSecondOne(
      Item const &lhs,
      Item const &rhs) noexcept;
  static bool hasSameName(Item const &lhs, Item const &rhs) noexcept;

  butter::small_vector<Item, kNumberOfExplicitlySpecifiedPropsSoftCap> items_{};
  butter::small_vector<RawPropsPropNameLength, kPropNameLengthHardCap>
      buckets_{};
};

} // namespace react
} // namespace facebook
