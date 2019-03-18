/**
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <better/map.h>
#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>
#include <react/core/RawValue.h>

namespace facebook {
namespace react {

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
class RawProps {
 public:
  /*
   * Creates an object with given `runtime` and `value`.
   */
  RawProps(jsi::Runtime &runtime, const jsi::Value &value) noexcept
      : RawProps(
            value.isNull() ? folly::dynamic::object()
                           : jsi::dynamicFromValue(runtime, value)) {}

  /*
   * Creates an object with given `folly::dynamic` object.
   * Deprecated.
   * We need this temporary, only because we have a callsite that does not have
   * a `jsi::Runtime` behind the data.
   */
  RawProps(const folly::dynamic &dynamic) noexcept
      :
#ifdef ANDROID
        dynamic_(dynamic),
#endif
        map_((better::map<std::string, RawValue>)RawValue(dynamic)) {
  }

  /*
   * Not moveable.
   */
  RawProps(RawProps &&other) noexcept = delete;
  RawProps &operator=(RawProps &&other) noexcept = delete;

  /*
   * Not copyable.
   */
  RawProps(const RawProps &other) noexcept = delete;
  RawProps &operator=(const RawProps &other) noexcept = delete;

#ifdef ANDROID
  /*
   * Deprecated. Do not use.
   * The support for explicit conversion to `folly::dynamic` is deprecated and
   * will be removed as soon Android implementation does not need it.
   */
  explicit operator folly::dynamic() const noexcept {
    return dynamic_;
  }
#endif

  /*
   * Returns a const unowning pointer to `RawValue` of a prop with a given name.
   * Returns `nullptr` if a prop with the given name does not exist.
   */
  const RawValue *at(const std::string &name) const noexcept {
    auto iterator = map_.find(name);
    if (iterator == map_.end()) {
      return nullptr;
    }

    return &iterator->second;
  }

 private:
#ifdef ANDROID
  const folly::dynamic dynamic_;
#endif

  const better::map<std::string, RawValue> map_;
};

} // namespace react
} // namespace facebook
