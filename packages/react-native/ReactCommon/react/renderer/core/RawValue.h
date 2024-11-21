/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_map>

#include <folly/dynamic.h>
#include <jsi/JSIDynamic.h>
#include <jsi/jsi.h>

#include <react/renderer/core/RawPropsPrimitives.h>

#include <react/debug/react_native_assert.h>

namespace facebook::react {

class RawPropsParser;

/*
 * `RawValue` abstracts some arbitrary complex data structure similar to JSON.
 * `RawValue` supports explicit conversion to: `bool`, `int`, `int64_t`,
 * `float`, `double`, `string`, and `vector` & `map` of those types and itself.
 *
 * The main intention of the class is to abstract React props parsing infra from
 * JSI, to enable support for any non-JSI-based data sources. The particular
 * implementation of the interface is a very slim abstraction around
 * `folly::dynamic` though.
 * In the near future, this class will hold a `jsi::Runtime` and `jsi::Value`
 * pair instead of `folly::dynamic`.
 *
 * How `RawValue` is different from `JSI::Value`:
 *  * `RawValue` provides much more scoped API without any references to
 * JavaScript specifics.
 *  * The API is much more C++-idiomatic and easy to use from C++ code.
 *  * The API prevents access to JSI/JavaScript internals from prop-parsing
 * code.
 *  * The `RawValue` is not copyable nor thread-safe, which prevent
 * misuse and accidental performance problems.
 *
 * How `RawValue` is different from `folly::dynamic`:
 *  * `RawValue` is a lazy data structure, it does not copy all content inside,
 * it provides efficient SAX-like access to the data.
 *  * `RawValue` has more static and C++-idiomatic API.
 *  * The `RawValue` is not copyable nor thread-safe, which prevent
 * misuse and accidental performance problems.
 */
class RawValue {
 public:
  /*
   * Constructors.
   */
  RawValue() noexcept : dynamic_(nullptr) {}

  RawValue(RawValue&& other) noexcept : dynamic_(std::move(other.dynamic_)) {}

  RawValue& operator=(RawValue&& other) noexcept {
    if (this != &other) {
      dynamic_ = std::move(other.dynamic_);
    }
    return *this;
  }

  explicit RawValue(const folly::dynamic& dynamic) noexcept
      : dynamic_(dynamic) {}

  explicit RawValue(folly::dynamic&& dynamic) noexcept
      : dynamic_(std::move(dynamic)) {}

  explicit RawValue(jsi::Runtime* runtime, jsi::Value& value) : runtime_(runtime), value_(std::move(value)) {}
  
private:
  jsi::Runtime* runtime_{};
  jsi::Value value_;
  
public:
  /**
   * Get the `jsi::Value` if this `RawProps` instance stores a `jsi::Value`, or `jsi::Value::undefined()` otherwise.
   * This API is used by pure JSI-based React Native Frameworks that skip the `RawPropsParser` route.
   * DO NOT store this `jsi::Value` in memory.
   */
  const jsi::Value& getJsiValue() {
    return value_;
  }
  
  /**
   * Get the `jsi::Runtime` if this `RawValue` instance stores a `jsi::Value`, or `nullptr` otherwise.
   * This API is used by pure JSI-based React Native Frameworks that skip the `RawPropsParser` route.
   * DO NOT store this `jsi::Runtime` in memory.
   */
  const jsi::Runtime* getRuntime() {
    return runtime_;
  }

 private:
  friend class RawProps;
  friend class RawPropsParser;
  friend class UIManagerBinding;

  /*
   * Copy constructor and copy assignment operator would be private and only for
   * internal use, but it's needed for user-code that does `auto val =
   * (butter::map<std::string, RawValue>)rawVal;`
   */
  RawValue(const RawValue& other) noexcept : dynamic_(other.dynamic_) {}

  RawValue& operator=(const RawValue& other) noexcept {
    if (this != &other) {
      dynamic_ = other.dynamic_;
    }
    return *this;
  }

 public:
  /*
   * Casts the value to a specified type.
   */
  template <typename T>
  explicit operator T() const {
    return castValue(dynamic_, (T*)nullptr);
  }

  inline explicit operator folly::dynamic() const noexcept {
    return dynamic_;
  }

  /*
   * Checks if the stored value has specified type.
   */
  template <typename T>
  bool hasType() const noexcept {
    return checkValueType(dynamic_, (T*)nullptr);
  }

  /*
   * Checks if the stored value is *not* `null`.
   */
  bool hasValue() const noexcept {
    return !dynamic_.isNull();
  }

 private:
  folly::dynamic dynamic_;

  static bool checkValueType(
      const folly::dynamic& /*dynamic*/,
      RawValue* /*type*/) noexcept {
    return true;
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      bool* /*type*/) noexcept {
    return dynamic.isBool();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      int* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      int64_t* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      float* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      double* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      std::string* /*type*/) noexcept {
    return dynamic.isString();
  }

  template <typename T>
  static bool checkValueType(
      const folly::dynamic& dynamic,
      std::vector<T>* /*type*/) noexcept {
    if (!dynamic.isArray()) {
      return false;
    }

    for (const auto& item : dynamic) {
      if (!checkValueType(item, (T*)nullptr)) {
        return false;
      }

      // Note: We test only one element.
      break;
    }

    return true;
  }

  template <typename T>
  static bool checkValueType(
      const folly::dynamic& dynamic,
      std::unordered_map<std::string, T>* /*type*/) noexcept {
    if (!dynamic.isObject()) {
      return false;
    }

    for (const auto& item : dynamic.items()) {
      react_native_assert(item.first.isString());
      if (!checkValueType(item.second, (T*)nullptr)) {
        return false;
      }

      // Note: We test only one element.
      break;
    }

    return true;
  }

  // Casts
  static RawValue castValue(
      const folly::dynamic& dynamic,
      RawValue* /*type*/) noexcept {
    return RawValue(dynamic);
  }

  static bool castValue(const folly::dynamic& dynamic, bool* /*type*/) {
    return dynamic.getBool();
  }

  static int castValue(const folly::dynamic& dynamic, int* /*type*/) {
    return static_cast<int>(dynamic.asInt());
  }

  static int64_t castValue(const folly::dynamic& dynamic, int64_t* /*type*/) {
    return dynamic.asInt();
  }

  static float castValue(const folly::dynamic& dynamic, float* /*type*/) {
    return static_cast<float>(dynamic.asDouble());
  }

  static double castValue(const folly::dynamic& dynamic, double* /*type*/) {
    return dynamic.asDouble();
  }

  static std::string castValue(
      const folly::dynamic& dynamic,
      std::string* /*type*/) {
    return dynamic.getString();
  }

  template <typename T>
  static std::vector<T> castValue(
      const folly::dynamic& dynamic,
      std::vector<T>* /*type*/) {
    react_native_assert(dynamic.isArray());
    auto result = std::vector<T>{};
    result.reserve(dynamic.size());
    for (const auto& item : dynamic) {
      result.push_back(castValue(item, (T*)nullptr));
    }
    return result;
  }

  template <typename T>
  static std::vector<std::vector<T>> castValue(
      const folly::dynamic& dynamic,
      std::vector<std::vector<T>>* /*type*/) {
    react_native_assert(dynamic.isArray());
    auto result = std::vector<std::vector<T>>{};
    result.reserve(dynamic.size());
    for (const auto& item : dynamic) {
      result.push_back(castValue(item, (std::vector<T>*)nullptr));
    }
    return result;
  }

  template <typename T>
  static std::unordered_map<std::string, T> castValue(
      const folly::dynamic& dynamic,
      std::unordered_map<std::string, T>* /*type*/) {
    react_native_assert(dynamic.isObject());
    auto result = std::unordered_map<std::string, T>{};
    for (const auto& item : dynamic.items()) {
      react_native_assert(item.first.isString());
      result[item.first.getString()] = castValue(item.second, (T*)nullptr);
    }
    return result;
  }
};

} // namespace facebook::react
