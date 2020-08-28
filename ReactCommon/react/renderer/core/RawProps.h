/*
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <limits>

#include <better/map.h>
#include <better/optional.h>
#include <better/small_vector.h>

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/core/RawPropsKey.h>
#include <react/renderer/core/RawPropsPrimitives.h>
#include <react/renderer/core/RawValue.h>
#include <vector>

namespace facebook {
namespace react {

class RawPropsParser;

/*
 * `RawProps` represents an untyped map of props comes from JavaScript side.
 * `RawProps` stores JSI (or `folly::dynamic`) primitives inside and abstract
 * them as `RawValue` objects.
 * `RawProps` is NOT a thread-safe type nor long-living type.
 * The caller must not store values of this type.
 * The class is practically a wrapper around a `jsi::Value and `jsi::Runtime`
 * pair (or folly::dynamic) preventing direct access to it and inefficient
 * misuse. Not copyable, not moveable.
 */
class RawProps final {
 public:
  /*
   * Mode
   * Represents the type of source data.
   */
  enum class Mode { Empty, JSI, Dynamic };

  /*
   * Creates empty RawProps objects.
   */
  RawProps();

  /*
   * Creates an object with given `runtime` and `value`.
   */
  RawProps(jsi::Runtime &runtime, jsi::Value const &value) noexcept;

  /*
   * Creates an object with given `folly::dynamic` object.
   * Deprecated. Do not use.
   * We need this temporary, only because we have a callsite that does not have
   * a `jsi::Runtime` behind the data.
   */
  RawProps(folly::dynamic const &dynamic) noexcept;

  /*
   * Not moveable.
   */
  RawProps(RawProps &&other) noexcept = delete;
  RawProps &operator=(RawProps &&other) noexcept = delete;

  /*
   * Not copyable.
   */
  RawProps(RawProps const &other) noexcept = delete;
  RawProps &operator=(RawProps const &other) noexcept = delete;

  void parse(RawPropsParser const &parser) const noexcept;

  /*
   * Deprecated. Do not use.
   * The support for explicit conversion to `folly::dynamic` is deprecated and
   * will be removed as soon Android implementation does not need it.
   */
  explicit operator folly::dynamic() const noexcept;

  /*
   * Returns `true` if the object is empty.
   * Empty `RawProps` does not have any stored data.
   */
  bool isEmpty() const noexcept;

  /*
   * Returns a const unowning pointer to `RawValue` of a prop with a given name.
   * Returns `nullptr` if a prop with the given name does not exist.
   */
  const RawValue *at(char const *name, char const *prefix, char const *suffix)
      const noexcept;

 private:
  friend class RawPropsParser;

  mutable RawPropsParser const *parser_{nullptr};

  /*
   * Source artefacts:
   */
  // Mode
  mutable Mode mode_;

  // Case 1: Source data is represented as `jsi::Object`.
  jsi::Runtime *runtime_;
  jsi::Value value_;

  // Case 2: Source data is represented as `folly::dynamic`.
  folly::dynamic dynamic_;

  /*
   * The index of a prop value that was evaluated on the previous iterations of
   * calling `at()`.
   */
  mutable int keyIndexCursor_{0};

  /*
   * Parsed artefacts:
   * To be used by `RawPropParser`.
   */
  mutable better::
      small_vector<RawPropsValueIndex, kNumberOfPropsPerComponentSoftCap>
          keyIndexToValueIndex_;
  mutable better::
      small_vector<RawValue, kNumberOfExplicitlySpecifedPropsSoftCap>
          values_;
};

} // namespace react
} // namespace facebook
