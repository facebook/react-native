<<<<<<< HEAD
/**
=======
/*
>>>>>>> fb/0.62-stable
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/small_vector.h>

#include <react/core/RawPropsKey.h>
#include <react/core/RawPropsPrimitives.h>

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
<<<<<<< HEAD
  void insert(RawPropsKey const &key, RawPropsValueIndex value);
=======
  void insert(RawPropsKey const &key, RawPropsValueIndex value) noexcept;
>>>>>>> fb/0.62-stable

  /*
   * Reindexes the stored data.
   * Must be called before `at` (after calling a bunch of `add`s).
   */
<<<<<<< HEAD
  void reindex();
=======
  void reindex() noexcept;
>>>>>>> fb/0.62-stable

  /*
   * Finds and returns the `value` (some index) by given `key`.
   * Returns `kRawPropsValueIndexEmpty` if the value wan't found.
   */
<<<<<<< HEAD
  RawPropsValueIndex at(char const *name, RawPropsPropNameLength length);

 private:
  static int comparator(void const *lhs, void const *rhs);

=======
  RawPropsValueIndex at(
      char const *name,
      RawPropsPropNameLength length) noexcept;

 private:
>>>>>>> fb/0.62-stable
  struct Item {
    RawPropsValueIndex value;
    RawPropsPropNameLength length;
    char name[kPropNameLengthHardCap];
  };

<<<<<<< HEAD
=======
  static bool shouldFirstOneBeBeforeSecondOne(
      Item const &lhs,
      Item const &rhs) noexcept;
  static bool hasSameName(Item const &lhs, Item const &rhs) noexcept;

>>>>>>> fb/0.62-stable
  better::small_vector<Item, kNumberOfExplicitlySpecifedPropsSoftCap> items_{};
  better::small_vector<RawPropsPropNameLength, kPropNameLengthHardCap>
      buckets_{};
};

} // namespace react
} // namespace facebook
