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
   * Creates empty RawProps objects.
   */
  RawProps() {
    empty_ = true;
  }

  /*
   * Creates an object with given `runtime` and `value`.
   */
  RawProps(jsi::Runtime &runtime, jsi::Value const &value) noexcept {
    empty_ = value.isNull();
    if (empty_) {
      return;
    }

    auto dynamic = jsi::dynamicFromValue(runtime, value);

    map_ = (better::map<std::string, RawValue>)RawValue(dynamic);

#ifdef ANDROID
    dynamic_ = dynamic;
#endif
  }

  /*
   * Creates an object with given `folly::dynamic` object.
   * Deprecated. Do not use.
   * We need this temporary, only because we have a callsite that does not have
   * a `jsi::Runtime` behind the data.
   */
  RawProps(folly::dynamic const &dynamic) noexcept {
    empty_ = dynamic.isNull();
    if (empty_) {
      return;
    }

    map_ = (better::map<std::string, RawValue>)RawValue(dynamic);

#ifdef ANDROID
    dynamic_ = dynamic;
#endif
  }

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

#ifdef ANDROID
  /*
   * Deprecated. Do not use.
   * The support for explicit conversion to `folly::dynamic` is deprecated and
   * will be removed as soon Android implementation does not need it.
   */
  explicit operator folly::dynamic() const noexcept {
    return empty_ ? folly::dynamic::object() : dynamic_;
  }
#endif

  /*
   * Returns `true` if the object is empty.
   * Empty `RawProps` does not have any stored data.
   */
  bool isEmpty() const noexcept {
    return empty_;
  }

  /*
   * Returns a const unowning pointer to `RawValue` of a prop with a given name.
   * Returns `nullptr` if a prop with the given name does not exist.
   */
  const RawValue *at(char const *name, char const *prefix, char const *suffix)
      const noexcept {
    if (empty_) {
      return nullptr;
    }

    char buffer[64];
    int length = 0;

    // Prefix
    if (prefix) {
      int prefixLength = strlen(prefix);
      memcpy(buffer, prefix, prefixLength);
      length = prefixLength;
    }

    // Name
    int nameLength = strlen(name);
    memcpy(buffer + length, name, nameLength);
    length += nameLength;

    // Suffix
    if (suffix) {
      int suffixLength = strlen(suffix);
      memcpy(buffer + length, suffix, suffixLength);
      length += suffixLength;
    }
    buffer[length] = 0;

    auto iterator = map_.find(buffer);
    if (iterator == map_.end()) {
      return nullptr;
    }

    return &iterator->second;
  }

 private:
  // When `empty_` is `true` other data members have undefined values.
  bool empty_;
  better::map<std::string, RawValue> map_;
#ifdef ANDROID
  folly::dynamic dynamic_;
#endif
};

} // namespace react
} // namespace facebook
