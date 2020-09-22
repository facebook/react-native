// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_JSVALUE
#define MICROSOFT_REACTNATIVE_JSVALUE

#include "Crash.h"
#include "winrt/Microsoft.ReactNative.h"

namespace winrt::Microsoft::ReactNative {

//==============================================================================
// Forward declarations.
//==============================================================================

struct JSValue;
struct JSValueObjectKeyValue;
struct JSValueArrayItem;
IJSValueReader MakeJSValueTreeReader(JSValue const &root) noexcept;
IJSValueReader MakeJSValueTreeReader(JSValue &&root) noexcept;
IJSValueWriter MakeJSValueTreeWriter() noexcept;
JSValue TakeJSValue(IJSValueWriter const &writer) noexcept;

//==============================================================================
// JSValueObject declaration.
//==============================================================================

//! JSValueObject is based on std::map and has a custom constructor with std::intializer_list.
//! It is possible to write: JSValueObject{{"X", 4}, {"Y", 5}} and assign it to JSValue.
//! It uses the std::less<> comparison algorithm that allows an efficient
//! key lookup using std::string_view that does not allocate memory for the std::string key.
struct JSValueObject : std::map<std::string, JSValue, std::less<>> {
  //! Default constructor.
  JSValueObject() = default;

  //! Construct JSValueObject from the move iterator.
  template <class TMoveInputIterator>
  JSValueObject(TMoveInputIterator first, TMoveInputIterator last) noexcept;

  //! Move-construct JSValueObject from the initializer list.
  JSValueObject(std::initializer_list<JSValueObjectKeyValue> initObject) noexcept;

  //! Move-construct JSValueObject from the string-JSValue map.
  JSValueObject(std::map<std::string, JSValue, std::less<>> &&other) noexcept;

  //! Delete copy constructor to avoid unexpected copies. Use the Copy method instead.
  JSValueObject(JSValueObject const &) = delete;

  // Default move constructor.
  JSValueObject(JSValueObject &&) = default;

  //! Delete copy assignment to avoid unexpected copies. Use the Copy method instead.
  JSValueObject &operator=(JSValueObject const &) = delete;

  // Default move assignment.
  JSValueObject &operator=(JSValueObject &&) = default;

  //! Do a deep copy of JSValueObject.
  JSValueObject Copy() const noexcept;

  //! Get a reference to object property value if the property is found,
  //! or a reference to a new property created with JSValue::Null value otherwise.
  JSValue &operator[](std::string_view propertyName) noexcept;

  //! Get a reference to object property value if the property is found,
  //! or a reference to JSValue::Null otherwise.
  JSValue const &operator[](std::string_view propertyName) const noexcept;

  //! Return true if this JSValueObject is strictly equal to other JSValueObject.
  //! Both objects must have the same set of equal properties.
  //! Property values must be equal.
  bool Equals(JSValueObject const &other) const noexcept;

  //! Return true if this JSValueObject is strictly equal to other JSValueObject
  //! after their property values are converted to the same type.
  //! See JSValue::JSEquals for details about the conversion.
  bool JSEquals(JSValueObject const &other) const noexcept;

  //! Create JSValueObject from IJSValueReader.
  static JSValueObject ReadFrom(IJSValueReader const &reader) noexcept;

  //! Write this JSValueObject to IJSValueWriter.
  void WriteTo(IJSValueWriter const &writer) const noexcept;

#pragma region Deprecated methods

  [[deprecated("Use JSEquals")]] bool EqualsAfterConversion(JSValueObject const &other) const noexcept;

#pragma endregion
};

//! True if left.Equals(right)
bool operator==(JSValueObject const &left, JSValueObject const &right) noexcept;

//! True if !left.Equals(right)
bool operator!=(JSValueObject const &left, JSValueObject const &right) noexcept;

//==============================================================================
// JSValueArray declaration.
//==============================================================================

//! JSValueArray is based on std::vector<JSValue> and has a custom constructor with std::intializer_list.
//! It is possible to write: JSValueArray{"X", 42, nullptr, true} and assign it to JSValue.
struct JSValueArray : std::vector<JSValue> {
  //! Default constructor.
  JSValueArray() = default;

  //! Constructs JSValueArray with 'size' count of JSValue::Null elements.
  explicit JSValueArray(size_type size) noexcept;

  //! Constructs JSValueArray with 'size' count elements.
  //! Each element is a copy of defaultValue.
  JSValueArray(size_type size, JSValue const &defaultValue) noexcept;

  //! Construct JSValueArray from the move iterator.
  template <class TMoveInputIterator, std::enable_if_t<!std::is_integral_v<TMoveInputIterator>, int> = 1>
  JSValueArray(TMoveInputIterator first, TMoveInputIterator last) noexcept;

  //! Move-construct JSValueArray from the initializer list.
  JSValueArray(std::initializer_list<JSValueArrayItem> initObject) noexcept;

  //! Move-construct JSValueArray from the JSValue vector.
  JSValueArray(std::vector<JSValue> &&other) noexcept;

  //! Delete copy constructor to avoid unexpected copies. Use the Copy method instead.
  JSValueArray(JSValueArray const &) = delete;

  // Default move constructor.
  JSValueArray(JSValueArray &&) = default;

  //! Delete copy assignment to avoid unexpected copies. Use the Copy method instead.
  JSValueArray &operator=(JSValueArray const &) = delete;

  // Default move assignment.
  JSValueArray &operator=(JSValueArray &&) = default;

  //! Do a deep copy of JSValueArray.
  JSValueArray Copy() const noexcept;

  //! Return true if this JSValueArray is strictly equal to other JSValueArray.
  //! Both arrays must have the same set of items. Items must have the same type and value.
  bool Equals(JSValueArray const &other) const noexcept;

  //! Return true if this JSValueArray is strictly equal to other JSValueArray
  //! after their items are converted to the same type.
  //! See JSValue::JSEquals for details about the conversion.
  bool JSEquals(JSValueArray const &other) const noexcept;

  //! Create JSValueArray from IJSValueReader.
  static JSValueArray ReadFrom(IJSValueReader const &reader) noexcept;

  //! Write this JSValueArray to IJSValueWriter.
  void WriteTo(IJSValueWriter const &writer) const noexcept;

#pragma region Deprecated methods

  [[deprecated("Use JSEquals")]] bool EqualsAfterConversion(JSValueArray const &other) const noexcept;

#pragma endregion
};

//! True if left.Equals(right)
bool operator==(JSValueArray const &left, JSValueArray const &right) noexcept;

//! True if !left.Equals(right)
bool operator!=(JSValueArray const &left, JSValueArray const &right) noexcept;

//==============================================================================
// JSValue declaration.
//==============================================================================

//! JSValue represents an immutable JavaScript value that can be passed as a parameter.
//! It is created to simplify working with IJSValueReader in some complex cases.
//! It takes more resources than direct use of IJSValueReader, but provides more flexibility.
//! The JSValue is an immutable and is safe to be used from multiple threads.
//! It is move-only to avoid unnecessary or unexpected copying of values.
//! For copy operations the explicit Copy() method must be used.
//! Note that the move operations are not thread safe.
struct JSValue {
  //! JSValue with JSValueType::Null.
  static JSValue const Null;

  //! JSValue with empty object.
  static JSValue const EmptyObject;

  //! JSValue with empty array.
  static JSValue const EmptyArray;

  //! JSValue with empty string.
  static JSValue const EmptyString;

  //! Create a Null JSValue.
  JSValue() noexcept;

  //! Create a Null JSValue.
  JSValue(std::nullptr_t) noexcept;

  //! Create an Object JSValue.
  JSValue(JSValueObject &&value) noexcept;

  //! Create an Array JSValue.
  JSValue(JSValueArray &&value) noexcept;

  //! Create a String JSValue.
  JSValue(std::string &&value) noexcept;

  //! Create a String JSValue from any type that can be converted to std::string_view.
  template <class TStringView, std::enable_if_t<std::is_convertible_v<TStringView, std::string_view>, int> = 1>
  JSValue(TStringView value) noexcept;

  //! Create a Boolean JSValue.
  template <class TBool, std::enable_if_t<std::is_same_v<TBool, bool>, int> = 1>
  JSValue(TBool value) noexcept;

  //! Create an Int64 JSValue from any integral type except bool.
  template <class TInt, std::enable_if_t<std::is_integral_v<TInt> && !std::is_same_v<TInt, bool>, int> = 1>
  JSValue(TInt value) noexcept;

  //! Create a Double JSValue.
  JSValue(double value) noexcept;

  //! Delete the copy constructor to avoid unexpected copies. Use the Copy method instead.
  JSValue(const JSValue &other) = delete;

  //! Move constructor. The 'other' JSValue becomes JSValue::Null.
  JSValue(JSValue &&other) noexcept;

  //! Destroys JSValue.
  ~JSValue() noexcept;

  //! Delete the copy assignment to avoid unexpected copies. Use the Copy method instead.
  JSValue &operator=(JSValue const &other) = delete;

  //! Move assignment. The 'other' JSValue becomes JSValue::Null.
  JSValue &operator=(JSValue &&other) noexcept;

  //! Do a deep copy of JSValue.
  JSValue Copy() const noexcept;

  //! Move out Object and set this to JSValue::Null. It returns JSValue::EmptyObject
  //! and keeps this JSValue unchanged if current type is not an object.
  JSValueObject MoveObject() noexcept;

  //! Move out Array and set this to JSValue::Null. It returns JSValue::EmptyArray
  //! and keeps this JSValue unchanged if current type is not an array.
  JSValueArray MoveArray() noexcept;

  //! Get JSValue type.
  JSValueType Type() const noexcept;

  //! Return true if JSValue type is Null.
  bool IsNull() const noexcept;

  //! Return pointer to JSValueObject if JSValue type is Object, or nullptr otherwise.
  JSValueObject const *TryGetObject() const noexcept;

  //! Return pointer to JSValueArray if JSValue type is Array, or nullptr otherwise.
  JSValueArray const *TryGetArray() const noexcept;

  //! Return pointer to string if JSValue type is String, or nullptr otherwise.
  std::string const *TryGetString() const noexcept;

  //! Return pointer to bool value if JSValue type is Boolean, or nullptr otherwise.
  bool const *TryGetBoolean() const noexcept;

  //! Return pointer to int64_t value if JSValue type is Int64, or nullptr otherwise.
  int64_t const *TryGetInt64() const noexcept;

  //! Return pointer to double value if JSValue type is Double, or nullptr otherwise.
  double const *TryGetDouble() const noexcept;

  //! Return Object representation of JSValue. It is JSValue::EmptyObject if type is not Object.
  JSValueObject const &AsObject() const noexcept;

  //! Return Array representation of JSValue. It is JSValue::EmptyArray if type is not Object.
  JSValueArray const &AsArray() const noexcept;

  //! Return a string representation of JSValue.
  //! Null is "null".
  //! Object and Array are empty strings "".
  //! Boolean is "true" or "false".
  //! Int64 is converted to string using integer representation.
  //! Double uses AsJSString() conversion which uses "NaN", "Infinity", and "-Infinity" for special values.
  std::string AsString() const noexcept;

  //! Return a Boolean representation of JSValue.
  //! Object and Array are true if they are not empty.
  //! String is true if it case-insensitively matches "true", "1", "yes", "y", or "on" strings.
  //! Int64 or Double are false if they are zero or NAN.
  bool AsBoolean() const noexcept;

  //! Return an int8_t representation of JSValue. It is the same as (int8_t)AsInt64().
  int8_t AsInt8() const noexcept;

  //! Return an int16_t representation of JSValue. It is the same as (int16_t)AsInt64().
  int16_t AsInt16() const noexcept;

  //! Return an int32_t representation of JSValue. It is the same as (int32_t)AsInt64().
  int32_t AsInt32() const noexcept;

  //! Return an int64_t representation of JSValue.
  //! String is converted to double first before converting to Int64.
  //! Boolean is converted to 0 or 1.
  int64_t AsInt64() const noexcept;

  //! Return an uint8_t representation of JSValue. It is the same as (uint8_t)AsInt64().
  uint8_t AsUInt8() const noexcept;

  //! Return an uint16_t representation of JSValue. It is the same as (uint16_t)AsInt64().
  uint16_t AsUInt16() const noexcept;

  //! Return an uint32_t representation of JSValue. It is the same as (uint32_t)AsInt64().
  uint32_t AsUInt32() const noexcept;

  //! Return an uint64_t representation of JSValue. It is the same as (uint64_t)AsInt64().
  uint64_t AsUInt64() const noexcept;

  //! Return a float representation of JSValue. It is the same as (float)AsDouble().
  float AsSingle() const noexcept;

  //! Return a double representation of JSValue.
  //! Boolean is converted to 0.0 or 1.0.
  //! Null, Object, and Array are 0.
  double AsDouble() const noexcept;

  //! Cast JSValue to std::string using AsString() call.
  explicit operator std::string() const noexcept;

  //! Cast JSValue to bool using AsBoolean() call.
  explicit operator bool() const noexcept;

  //! Cast JSValue to int8_t using AsInt8() call.
  explicit operator int8_t() const noexcept;

  //! Cast JSValue to int16_t using AsInt16() call.
  explicit operator int16_t() const noexcept;

  //! Cast JSValue to int32_t using AsInt32() call.
  explicit operator int32_t() const noexcept;

  //! Cast JSValue to int64_t using AsInt64() call.
  explicit operator int64_t() const noexcept;

  //! Cast JSValue to uint8_t using AsUInt8() call.
  explicit operator uint8_t() const noexcept;

  //! Cast JSValue to uint16_t using AsUInt16() call.
  explicit operator uint16_t() const noexcept;

  //! Cast JSValue to uint32_t using AsUInt32() call.
  explicit operator uint32_t() const noexcept;

  //! Cast JSValue to uint64_t using AsUInt64() call.
  explicit operator uint64_t() const noexcept;

  //! Cast JSValue to float using (float)AsDouble() call.
  explicit operator float() const noexcept;

  //! Cast JSValue to double using AsDouble() call.
  explicit operator double() const noexcept;

  //! Return a string representation of JSValue. It is equivalent to JavaScript String(value) result.
  std::string AsJSString() const noexcept;

  //! Return a bool representation of JSValue. It is equivalent to JavaScript Boolean(value) result.
  bool AsJSBoolean() const noexcept;

  //! Return a Double representation of JSValue. It is equivalent to JavaScript Number(value) result.
  double AsJSNumber() const noexcept;

  //! Convert JSValue to a readable string that can be used for logging.
  std::string ToString() const noexcept;

  //! Return value T that is created from JSValue using the ReadValue function override.
  //! Default T is constructed by using default constructor.
  template <
      class T,
      std::enable_if_t<std::is_default_constructible_v<T> && !std::is_constructible_v<T, std::nullptr_t>, int> = 0>
  T To() const noexcept;

  //! Return value T that is created from JSValue using the ReadValue function override.
  //! Default T is constructed by using constructor that receives nullptr as a parameter.
  template <class T, std::enable_if_t<std::is_constructible_v<T, std::nullptr_t>, int> = 0>
  T To() const noexcept;

  //! Return value T that is created from JSValue using the ReadValue function override.
  //! Default T is constructed from the provided 'default' value.
  template <class T>
  T To(T &&defaultValue) const noexcept;

  //! Create JSValue from a type that has WriteValue method defined to write to IJSValueWriter.
  template <class T>
  static JSValue From(T const &value) noexcept;

  //! Return property count if JSValue is Object, or 0 otherwise.
  size_t PropertyCount() const noexcept;

  //! Get a pointer to object property value if JSValue type is Object and the property is found,
  //! or nullptr otherwise.
  JSValue const *TryGetObjectProperty(std::string_view propertyName) const noexcept;

  //! Get a reference to object property value if JSValue type is Object and the property is found,
  //! or a reference to JSValue::Null otherwise.
  JSValue const &GetObjectProperty(std::string_view propertyName) const noexcept;

  //! Get a reference to object property value if JSValue type is Object and the property is found,
  //! or a reference to JSValue::Null otherwise.
  JSValue const &operator[](std::string_view propertyName) const noexcept;

  //! Return item count if JSValue is Array, or 0 otherwise.
  size_t ItemCount() const noexcept;

  //! Get a pointer to array item if JSValue type is Array and the index is in bounds,
  //! or nullptr otherwise.
  JSValue const *TryGetArrayItem(JSValueArray::size_type index) const noexcept;

  //! Get a reference to array item if JSValue type is Array and the index is in bounds,
  //! or a reference to JSValue::Null otherwise.
  JSValue const &GetArrayItem(JSValueArray::size_type index) const noexcept;

  //! Get a reference to array item if JSValue type is Array and the index is in bounds,
  //! or a reference to JSValue::Null otherwise.
  JSValue const &operator[](JSValueArray::size_type index) const noexcept;

  //! Return true if this JSValue is strictly equal to JSValue.
  //! Compared values must have the same type and value.
  //!
  //! The behavior is similar to JavaScript === operator except for Object and Array where
  //! this functions does a deep structured comparison instead of pointer equality.
  bool Equals(JSValue const &other) const noexcept;

  //! Return true if this JSValue is strictly equal to JSValue after they are converted to the same type.
  //!
  //! Null is not converted to any other type before comparison.
  //! Object and Array types are converted first to a String type using AsString() before comparing
  //! with other types, and then we apply the same rules as for the String type.
  //! String is converted to Double before comparing with Boolean, Int64, or Double.
  //! Boolean is converted to 1.0 and +0.0 when comparing with String, Int64, or Double.
  //! Int64 is converted to Double before comparing with other types.
  //!
  //! The behavior is similar to JavaScript == operator except for Object and Array for which
  //! this functions does a deep structured comparison using JSEquals instead
  //! of pointer equality.
  bool JSEquals(JSValue const &other) const noexcept;

  //! Create JSValue from IJSValueReader.
  static JSValue ReadFrom(IJSValueReader const &reader) noexcept;

  //! Create JSValueObject from IJSValueReader.
  static JSValueObject ReadObjectFrom(IJSValueReader const &reader) noexcept;

  //! Create JSValueArray from IJSValueReader.
  static JSValueArray ReadArrayFrom(IJSValueReader const &reader) noexcept;

  //! Write this JSValue to IJSValueWriter.
  void WriteTo(IJSValueWriter const &writer) const noexcept;

#pragma region Deprecated methods

  // The methods below are deprecated in favor of other methods with clearer semantic
  [[deprecated("Use TryGetObject or AsObject")]] JSValueObject const &Object() const noexcept;
  [[deprecated("Use TryGetArray or As Array")]] JSValueArray const &Array() const noexcept;
  [[deprecated("Use TryGetString, AsString, or AsJSString")]] std::string const &String() const noexcept;
  [[deprecated("Use TryGetBoolean, AsBoolean, or AsJSBoolean")]] bool Boolean() const noexcept;
  [[deprecated("Use TryGetInt64, AsInt64, or AsJSNumber")]] int64_t Int64() const noexcept;
  [[deprecated("Use TryGetDouble, AsDouble, or AsJSNumber")]] double Double() const noexcept;

  // We have renamed or moved the methods below.
  template <class T>
  [[deprecated("Use JSValue::To")]] T As() const noexcept;
  template <class T>
  [[deprecated("Use JSValue::To")]] T As(T &&defaultValue) const noexcept;
  [[deprecated("Use MoveObject")]] JSValueObject TakeObject() noexcept;
  [[deprecated("Use MoveArray")]] JSValueArray TakeArray() noexcept;
  [[deprecated("Use JSValueObject::Copy")]] static JSValueObject CopyObject(JSValueObject const &other) noexcept;
  [[deprecated("Use JSValueArray::Copy")]] static JSValueArray CopyArray(JSValueArray const &other) noexcept;
  [[deprecated("Use JSValueObject::WriteTo")]] static void WriteObjectTo(
      IJSValueWriter const &writer,
      JSValueObject const &value) noexcept;
  [[deprecated("Use JSValueArray::WriteTo")]] static void WriteArrayTo(
      IJSValueWriter const &writer,
      JSValueArray const &value) noexcept;
  [[deprecated("Use JSEquals")]] bool EqualsAfterConversion(JSValue const &other) const noexcept;
  [[deprecated("Use AsSingle")]] float AsFloat() const noexcept;

#pragma endregion

 private: // Instance fields
  JSValueType m_type;
  union {
    JSValueObject m_object;
    JSValueArray m_array;
    std::string m_string;
    bool m_bool;
    int64_t m_int64;
    double m_double;
  };
};

//! True if left.Equals(right)
bool operator==(JSValue const &left, JSValue const &right) noexcept;

//! True if !left.Equals(right)
bool operator!=(JSValue const &left, JSValue const &right) noexcept;

//===========================================================================
// Helper classes for JSValueObject and JSValueArray initialization lists.
//===========================================================================

//! Helps initialize key-value pairs for JSValueObject.
//! It creates its own instance of JSValue which then can be moved to JSValueObject.
struct JSValueObjectKeyValue {
  template <class TKey, class TValue>
  JSValueObjectKeyValue(TKey &&key, TValue &&value) noexcept
      : Key(std::forward<TKey>(key)), Value(std::forward<TValue>(value)) {}

  std::string_view Key;
  JSValue Value;
};

//! Helps initialize items for JSValueArray.
//! It creates its own instance of JSValue which then can be moved to JSValueArray.
struct JSValueArrayItem {
  template <class TItem>
  JSValueArrayItem(TItem &&item) noexcept : Item(std::forward<TItem>(item)) {}

  JSValue Item;
};

//===========================================================================
// Inline JSValueObject implementation.
//===========================================================================
template <class TMoveInputIterator>
JSValueObject::JSValueObject(TMoveInputIterator first, TMoveInputIterator last) noexcept {
  auto it = first;
  while (it != last) {
    auto pair = *it++;
    try_emplace(std::move(pair.first), std::move(pair.second));
  }
}

// Deprecated
inline bool JSValueObject::EqualsAfterConversion(JSValueObject const &other) const noexcept {
  return JSEquals(other);
}

//===========================================================================
// Inline JSValueObject standalone function implementations.
//===========================================================================

inline bool operator==(JSValueObject const &left, JSValueObject const &right) noexcept {
  return left.Equals(right);
}

inline bool operator!=(JSValueObject const &left, JSValueObject const &right) noexcept {
  return !left.Equals(right);
}

//===========================================================================
// Inline JSValueArray implementation.
//===========================================================================

template <class TMoveInputIterator, std::enable_if_t<!std::is_integral_v<TMoveInputIterator>, int>>
JSValueArray::JSValueArray(TMoveInputIterator first, TMoveInputIterator last) noexcept {
  auto it = first;
  while (it != last) {
    push_back(*it++);
  }
}

// Deprecated
inline bool JSValueArray::EqualsAfterConversion(JSValueArray const &other) const noexcept {
  return JSEquals(other);
}

//===========================================================================
// Inline JSValueArray standalone function implementations.
//===========================================================================

inline bool operator==(JSValueArray const &left, JSValueArray const &right) noexcept {
  return left.Equals(right);
}

inline bool operator!=(JSValueArray const &left, JSValueArray const &right) noexcept {
  return !left.Equals(right);
}

//===========================================================================
// Inline JSValue implementation.
//===========================================================================

#pragma warning(push)
#pragma warning(disable : 26495) // False positive for union member not initialized
inline JSValue::JSValue() noexcept : m_type{JSValueType::Null}, m_int64{0} {}
inline JSValue::JSValue(std::nullptr_t) noexcept : m_type{JSValueType::Null}, m_int64{0} {}
inline JSValue::JSValue(JSValueObject &&value) noexcept : m_type{JSValueType::Object}, m_object(std::move(value)) {}
inline JSValue::JSValue(JSValueArray &&value) noexcept : m_type{JSValueType::Array}, m_array(std::move(value)) {}
inline JSValue::JSValue(std::string &&value) noexcept : m_type{JSValueType::String}, m_string{std::move(value)} {}
template <class TStringView, std::enable_if_t<std::is_convertible_v<TStringView, std::string_view>, int>>
inline JSValue::JSValue(TStringView value) noexcept : m_type{JSValueType::String}, m_string{value} {}
template <class TBool, std::enable_if_t<std::is_same_v<TBool, bool>, int>>
inline JSValue::JSValue(TBool value) noexcept : m_type{JSValueType::Boolean}, m_bool{value} {}
template <class TInt, std::enable_if_t<std::is_integral_v<TInt> && !std::is_same_v<TInt, bool>, int>>
inline JSValue::JSValue(TInt value) noexcept : m_type{JSValueType::Int64}, m_int64{static_cast<int64_t>(value)} {}
inline JSValue::JSValue(double value) noexcept : m_type{JSValueType::Double}, m_double{value} {}
#pragma warning(pop)

inline JSValueType JSValue::Type() const noexcept {
  return m_type;
}

inline bool JSValue::IsNull() const noexcept {
  return m_type == JSValueType::Null;
}

inline JSValueObject const *JSValue::TryGetObject() const noexcept {
  return (m_type == JSValueType::Object) ? &m_object : nullptr;
}

inline JSValueArray const *JSValue::TryGetArray() const noexcept {
  return (m_type == JSValueType::Array) ? &m_array : nullptr;
}

inline std::string const *JSValue::TryGetString() const noexcept {
  return (m_type == JSValueType::String) ? &m_string : nullptr;
}

inline bool const *JSValue::TryGetBoolean() const noexcept {
  return (m_type == JSValueType::Boolean) ? &m_bool : nullptr;
}

inline int64_t const *JSValue::TryGetInt64() const noexcept {
  return (m_type == JSValueType::Int64) ? &m_int64 : nullptr;
}

inline double const *JSValue::TryGetDouble() const noexcept {
  return (m_type == JSValueType::Double) ? &m_double : nullptr;
}

inline JSValueObject const &JSValue::AsObject() const noexcept {
  return (m_type == JSValueType::Object) ? m_object : EmptyObject.m_object;
}

inline JSValueArray const &JSValue::AsArray() const noexcept {
  return (m_type == JSValueType::Array) ? m_array : EmptyArray.m_array;
}

inline int8_t JSValue::AsInt8() const noexcept {
  return (int8_t)AsInt64();
}

inline int16_t JSValue::AsInt16() const noexcept {
  return (int16_t)AsInt64();
}

inline int32_t JSValue::AsInt32() const noexcept {
  return (int32_t)AsInt64();
}

inline uint8_t JSValue::AsUInt8() const noexcept {
  return (uint8_t)AsInt64();
}

inline uint16_t JSValue::AsUInt16() const noexcept {
  return (uint16_t)AsInt64();
}

inline uint32_t JSValue::AsUInt32() const noexcept {
  return (uint32_t)AsInt64();
}

inline uint64_t JSValue::AsUInt64() const noexcept {
  return (uint64_t)AsInt64();
}

inline float JSValue::AsSingle() const noexcept {
  return (float)AsDouble();
}

inline JSValue::operator std::string() const noexcept {
  return AsString();
}

inline JSValue::operator bool() const noexcept {
  return AsBoolean();
}

inline JSValue::operator int8_t() const noexcept {
  return AsInt8();
}

inline JSValue::operator int16_t() const noexcept {
  return AsInt16();
}

inline JSValue::operator int32_t() const noexcept {
  return AsInt32();
}

inline JSValue::operator int64_t() const noexcept {
  return AsInt64();
}

inline JSValue::operator uint8_t() const noexcept {
  return AsUInt8();
}

inline JSValue::operator uint16_t() const noexcept {
  return AsUInt16();
}

inline JSValue::operator uint32_t() const noexcept {
  return AsUInt32();
}

inline JSValue::operator uint64_t() const noexcept {
  return AsUInt64();
}

inline JSValue::operator float() const noexcept {
  return AsSingle();
}

inline JSValue::operator double() const noexcept {
  return AsDouble();
}

inline JSValue const &JSValue::operator[](std::string_view propertyName) const noexcept {
  return GetObjectProperty(propertyName);
}

inline JSValue const &JSValue::operator[](JSValueArray::size_type index) const noexcept {
  return GetArrayItem(index);
}

template <>
inline std::string JSValue::To() const noexcept {
  return AsString();
}

template <>
inline bool JSValue::To() const noexcept {
  return AsBoolean();
}

template <>
inline int8_t JSValue::To() const noexcept {
  return AsInt8();
}

template <>
inline int16_t JSValue::To() const noexcept {
  return AsInt16();
}

template <>
inline int32_t JSValue::To() const noexcept {
  return AsInt32();
}

template <>
inline int64_t JSValue::To() const noexcept {
  return AsInt64();
}

template <>
inline uint8_t JSValue::To() const noexcept {
  return AsUInt8();
}

template <>
inline uint16_t JSValue::To() const noexcept {
  return AsUInt16();
}

template <>
inline uint32_t JSValue::To() const noexcept {
  return AsUInt32();
}

template <>
inline uint64_t JSValue::To() const noexcept {
  return AsUInt64();
}

template <>
inline float JSValue::To() const noexcept {
  return AsSingle();
}

template <>
inline double JSValue::To() const noexcept {
  return AsDouble();
}

template <
    class T,
    std::enable_if_t<std::is_default_constructible_v<T> && !std::is_constructible_v<T, std::nullptr_t>, int>>
inline T JSValue::To() const noexcept {
  T result;
  ReadValue(MakeJSValueTreeReader(*this), /*out*/ result);
  return result;
}

template <class T, std::enable_if_t<std::is_constructible_v<T, std::nullptr_t>, int>>
inline T JSValue::To() const noexcept {
  T result{nullptr};
  ReadValue(MakeJSValueTreeReader(*this), /*out*/ result);
  return result;
}

template <class T>
inline T JSValue::To(T &&defaultValue) const noexcept {
  T result{std::move(defaultValue)};
  ReadValue(MakeJSValueTreeReader(*this), /*out*/ result);
  return result;
}

template <class T>
JSValue JSValue::From(T const &value) noexcept {
  auto writer = MakeJSValueTreeWriter();
  WriteValue(writer, value);
  return TakeJSValue(writer);
}

inline /*static*/ JSValueObject JSValue::ReadObjectFrom(IJSValueReader const &reader) noexcept {
  return JSValueObject::ReadFrom(reader);
}

inline /*static*/ JSValueArray JSValue::ReadArrayFrom(IJSValueReader const &reader) noexcept {
  return JSValueArray::ReadFrom(reader);
}

//===========================================================================
// JSValue deprecated methods.
//===========================================================================

inline const JSValueObject &JSValue::Object() const noexcept {
  return AsObject();
}

inline const JSValueArray &JSValue::Array() const noexcept {
  return AsArray();
}

inline const std::string &JSValue::String() const noexcept {
  return (m_type == JSValueType::String) ? m_string : EmptyString.m_string;
}

inline bool JSValue::Boolean() const noexcept {
  return (m_type == JSValueType::Boolean) ? m_bool : false;
}

inline int64_t JSValue::Int64() const noexcept {
  return (m_type == JSValueType::Int64) ? m_int64 : 0;
}

inline double JSValue::Double() const noexcept {
  return (m_type == JSValueType::Double) ? m_double : 0;
}

template <class T>
inline T JSValue::As() const noexcept {
  return To<T>();
}

template <class T>
inline T JSValue::As(T &&defaultValue) const noexcept {
  return To<T>(std::move(defaultValue));
}

inline JSValueObject JSValue::TakeObject() noexcept {
  return MoveObject();
}

inline JSValueArray JSValue::TakeArray() noexcept {
  return MoveArray();
}

inline /*static*/ JSValueObject JSValue::CopyObject(JSValueObject const &other) noexcept {
  return other.Copy();
}

inline /*static*/ JSValueArray JSValue::CopyArray(JSValueArray const &other) noexcept {
  return other.Copy();
}

inline /*static*/ void JSValue::WriteObjectTo(IJSValueWriter const &writer, JSValueObject const &value) noexcept {
  value.WriteTo(writer);
}

inline /*static*/ void JSValue::WriteArrayTo(IJSValueWriter const &writer, JSValueArray const &value) noexcept {
  value.WriteTo(writer);
}

inline bool JSValue::EqualsAfterConversion(JSValue const &other) const noexcept {
  return JSEquals(other);
}

inline float JSValue::AsFloat() const noexcept {
  return (float)AsDouble();
}

//===========================================================================
// Inline JSValue standalone function implementations.
//===========================================================================

inline bool operator==(JSValue const &left, JSValue const &right) noexcept {
  return left.Equals(right);
}

inline bool operator!=(JSValue const &left, JSValue const &right) noexcept {
  return !left.Equals(right);
}

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_JSVALUE
