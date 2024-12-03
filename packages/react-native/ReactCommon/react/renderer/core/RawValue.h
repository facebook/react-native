/*
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

#pragma once

#include <unordered_map>
#include <variant>

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
  RawValue() noexcept : value_(folly::dynamic(nullptr)) {}

  RawValue(RawValue&& other) noexcept : value_(std::move(other.value_)) {}

  RawValue& operator=(RawValue&& other) noexcept {
    if (this != &other) {
      value_ = std::move(other.value_);
    }
    return *this;
  }

  explicit RawValue(jsi::Runtime& runtime, const jsi::Value& value) noexcept
      : value_(std::make_pair(&runtime, jsi::Value(runtime, value))) {}

  explicit RawValue(jsi::Runtime& runtime, jsi::Value&& value) noexcept
      : value_(std::make_pair(&runtime, std::move(value))) {}

  explicit RawValue(const folly::dynamic& dynamic) noexcept : value_(dynamic) {}

  explicit RawValue(folly::dynamic&& dynamic) noexcept
      : value_(std::move(dynamic)) {}

 private:
  friend class RawProps;
  friend class RawPropsParser;
  friend class UIManagerBinding;

  /*
   * Copy constructor and copy assignment operator would be private and only for
   * internal use, but it's needed for user-code that does `auto val =
   * (butter::map<std::string, RawValue>)rawVal;`
   */
  RawValue(const RawValue& other) noexcept {
    if (std::holds_alternative<folly::dynamic>(other.value_)) {
      folly::dynamic dynamic = std::get<folly::dynamic>(other.value_);
      value_ = dynamic;
    } else {
      const auto& [runtime, value] = std::get<JsiValuePair>(other.value_);
      value_ = std::make_pair(runtime, jsi::Value(*runtime, value));
    }
  }

  RawValue& operator=(const RawValue& other) noexcept {
    if (this != &other) {
      if (std::holds_alternative<folly::dynamic>(other.value_)) {
        folly::dynamic dynamic = std::get<folly::dynamic>(other.value_);
        value_ = dynamic;
      } else {
        const auto& [runtime, value] = std::get<JsiValuePair>(other.value_);
        value_ = std::make_pair(runtime, jsi::Value(*runtime, value));
      }
    }
    return *this;
  }

 public:
  using JsiValuePair = std::pair<jsi::Runtime*, jsi::Value>;

  /*
   * Casts the value to a specified type.
   */
  template <typename T>
  explicit operator T() const {
    if (std::holds_alternative<folly::dynamic>(value_)) {
      folly::dynamic dynamic = std::get<folly::dynamic>(value_);
      return castValue(dynamic, (T*)nullptr);
    } else {
      const auto& [runtime, value] = std::get<JsiValuePair>(value_);
      return castValue(value, runtime, (T*)nullptr);
    }
  }

  inline explicit operator folly::dynamic() const noexcept {
    return std::get<folly::dynamic>(value_);
  }

  /*
   * Checks if the stored value has specified type.
   */
  template <typename T>
  bool hasType() const noexcept {
    if (std::holds_alternative<folly::dynamic>(value_)) {
      folly::dynamic dynamic = std::get<folly::dynamic>(value_);
      return checkValueType(dynamic, (T*)nullptr);
    } else {
      const auto& [runtime, value] = std::get<JsiValuePair>(value_);
      return checkValueType(value, runtime, (T*)nullptr);
    }
  }

  /*
   * Checks if the stored value is *not* `null`.
   */
  bool hasValue() const noexcept {
    if (std::holds_alternative<folly::dynamic>(value_)) {
      folly::dynamic dynamic = std::get<folly::dynamic>(value_);
      return !dynamic.isNull();
    } else {
      const auto& [runtime, value] = std::get<JsiValuePair>(value_);
      return !value.isNull() && !value.isUndefined();
    }
  }

  /**
   * In case this RawValue was constructed from a jsi::Value
   * this method will return the jsi::Runtime and jsi::Value pair.
   */
  const JsiValuePair& experimental_getJsiValuePair() const {
    return std::get<JsiValuePair>(value_);
  }

 private:
  using ValueVariant = std::variant<folly::dynamic, JsiValuePair>;
  ValueVariant value_;

  static bool checkValueType(
      const folly::dynamic& /*dynamic*/,
      RawValue* /*type*/) noexcept {
    return true;
  }

  static bool checkValueType(
      const jsi::Value& /*value*/,
      jsi::Runtime* /*runtime*/,
      RawValue* /*type*/) noexcept {
    return true;
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      bool* /*type*/) noexcept {
    return dynamic.isBool();
  }

  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      bool* /*type*/) noexcept {
    return value.isBool();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      int* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      int* /*type*/) noexcept {
    return value.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      int64_t* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      int64_t* /*type*/) noexcept {
    return value.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      float* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      float* /*type*/) noexcept {
    return value.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      double* /*type*/) noexcept {
    return dynamic.isNumber();
  }

  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      double* /*type*/) noexcept {
    return value.isNumber();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      std::string* /*type*/) noexcept {
    return dynamic.isString();
  }

  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      std::string* /*type*/) noexcept {
    return value.isString();
  }

  static bool checkValueType(
      const folly::dynamic& dynamic,
      JsiValuePair* /*type*/) noexcept {
    return false;
  }

  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      JsiValuePair* /*type*/) noexcept {
    return true;
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
      const jsi::Value& value,
      jsi::Runtime* runtime,
      std::vector<T>* /*type*/) noexcept {
    if (!value.isObject()) {
      return false;
    }

    jsi::Object asObject = value.asObject(*runtime);

    if (!asObject.isArray(*runtime)) {
      return false;
    }

    auto array = asObject.asArray(*runtime);
    size_t size = array.size(*runtime);
    for (size_t i = 0; i < size; i++) {
      jsi::Value itemValue = array.getValueAtIndex(*runtime, i);
      if (!checkValueType(itemValue, runtime, (T*)nullptr)) {
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

  template <typename T>
  static bool checkValueType(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      std::unordered_map<std::string, T>* /*type*/) noexcept {
    if (!value.isObject()) {
      return false;
    }

    jsi::Object asObject = value.asObject(*runtime);

    if (asObject.isArray(*runtime)) {
      return false;
    }

    auto propertyNames = asObject.getPropertyNames(*runtime);
    size_t size = propertyNames.size(*runtime);
    for (size_t i = 0; i < size; i++) {
      jsi::String propertyName =
          propertyNames.getValueAtIndex(*runtime, i).getString(*runtime);
      jsi::Value propertyValue = asObject.getProperty(*runtime, propertyName);
      if (!checkValueType(propertyValue, runtime, (T*)nullptr)) {
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

  static RawValue castValue(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      RawValue* /*type*/) noexcept {
    return RawValue(*runtime, value);
  }

  static bool castValue(const folly::dynamic& dynamic, bool* /*type*/) {
    return dynamic.getBool();
  }

  static bool
  castValue(const jsi::Value& value, jsi::Runtime* runtime, bool* /*type*/) {
    return value.asBool();
  }

  static int castValue(const folly::dynamic& dynamic, int* /*type*/) {
    return static_cast<int>(dynamic.asInt());
  }

  static int
  castValue(const jsi::Value& value, jsi::Runtime* runtime, int* /*type*/) {
    double number = value.asNumber();
    return static_cast<int>(number);
  }

  static int64_t castValue(const folly::dynamic& dynamic, int64_t* /*type*/) {
    return dynamic.asInt();
  }

  static int64_t
  castValue(const jsi::Value& value, jsi::Runtime* runtime, int64_t* /*type*/) {
    double number = value.asNumber();
    return static_cast<int64_t>(number);
  }

  static float castValue(const folly::dynamic& dynamic, float* /*type*/) {
    return static_cast<float>(dynamic.asDouble());
  }

  static float
  castValue(const jsi::Value& value, jsi::Runtime* runtime, float* /*type*/) {
    double number = value.asNumber();
    return static_cast<float>(number);
  }

  static double castValue(const folly::dynamic& dynamic, double* /*type*/) {
    return dynamic.asDouble();
  }

  static double
  castValue(const jsi::Value& value, jsi::Runtime* runtime, double* /*type*/) {
    return value.asNumber();
  }

  static std::string castValue(
      const folly::dynamic& dynamic,
      std::string* /*type*/) {
    return dynamic.getString();
  }

  static std::string castValue(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      std::string* /*type*/) {
    jsi::String stringValue = value.getString(*runtime);
    return stringValue.utf8(*runtime);
  }

  static JsiValuePair castValue(
      const folly::dynamic& dynamic,
      JsiValuePair* /*type*/) {
    react_native_assert(false);
  }

  static JsiValuePair castValue(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      JsiValuePair* /*type*/) {
    jsi::Value valueCopy = jsi::Value(*runtime, value);
    return std::make_pair(runtime, std::move(valueCopy));
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
  static std::vector<T> castValue(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      std::vector<T>* /*type*/) {
    react_native_assert(value.isObject());
    jsi::Object object = value.asObject(*runtime);
    react_native_assert(object.isArray(*runtime));
    auto array = object.asArray(*runtime);
    auto size = array.size(*runtime);
    std::vector<T> result;
    result.reserve(size);
    for (size_t i = 0; i < size; i++) {
      jsi::Value itemValue = array.getValueAtIndex(*runtime, i);
      T item = castValue(itemValue, runtime, (T*)nullptr);
      result.push_back(std::move(item));
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
  static std::vector<std::vector<T>> castValue(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      std::vector<std::vector<T>>* /*type*/) {
    react_native_assert(value.isObject());
    jsi::Object object = value.asObject(*runtime);
    react_native_assert(object.isArray(*runtime));
    jsi::Array array = object.asArray(*runtime);
    size_t size = array.size(*runtime);
    std::vector<std::vector<T>> result;
    result.reserve(size);
    for (size_t i = 0; i < size; i++) {
      jsi::Value itemValue = array.getValueAtIndex(*runtime, i);
      std::vector<T> item =
          castValue(itemValue, runtime, (std::vector<T>*)nullptr);
      result.push_back(std::move(item));
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

  template <typename T>
  static std::unordered_map<std::string, T> castValue(
      const jsi::Value& value,
      jsi::Runtime* runtime,
      std::unordered_map<std::string, T>* /*type*/) {
    react_native_assert(value.isObject());
    jsi::Object object = value.asObject(*runtime);
    jsi::array propertyNames = object.getPropertyNames(*runtime);
    size_t size = propertyNames.size(*runtime);
    std::unordered_map<std::string, T> result;
    for (size_t i = 0; i < size; i++) {
      jsi::Value propertyNameValue = propertyNames.getValueAtIndex(*runtime, i);
      jsi::String propertyName = propertyNameValue.getString(*runtime);
      jsi::Value propertyValue = object.getProperty(*runtime, propertyName);
      if (propertyValue.isUndefined()) {
        // Skip undefined values to mimic JSIDynamic::dynamicFromValue behavior.
        // Null values are allowed in the map.
        continue;
      }

      std::string propertyNameString = propertyName.utf8(*runtime);
      T property = castValue(propertyValue, runtime, (T*)nullptr);
      result.emplace(propertyNameString, std::move(property));
    }
    return result;
  }
};

} // namespace facebook::react
