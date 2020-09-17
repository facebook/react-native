// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_JSVALUETREEREADER
#define MICROSOFT_REACTNATIVE_JSVALUETREEREADER

#include "JSValue.h"

namespace winrt::Microsoft::ReactNative {

struct JSValueTreeReader : implements<JSValueTreeReader, IJSValueReader> {
  JSValueTreeReader(const JSValue &value) noexcept;
  JSValueTreeReader(JSValue &&value) noexcept;

 public: // IJSValueReader
  JSValueType ValueType() noexcept;
  bool GetNextObjectProperty(hstring &propertyName) noexcept;
  bool GetNextArrayItem() noexcept;
  hstring GetString() noexcept;
  bool GetBoolean() noexcept;
  int64_t GetInt64() noexcept;
  double GetDouble() noexcept;

 private:
  struct StackEntry {
    StackEntry(const JSValue &value, const JSValueObject::const_iterator &property) noexcept;
    StackEntry(const JSValue &value, const JSValueArray::const_iterator &item) noexcept;

    const JSValue &Value;
    JSValueArray::const_iterator Item;
    JSValueObject::const_iterator Property;
  };

 private:
  void SetCurrentValue(const JSValue &value) noexcept;

 private:
  const JSValue m_ownedValue;
  const JSValue &m_root;
  const JSValue *m_current;
  bool m_isInContainer{false};
  std::vector<StackEntry> m_stack;
};

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_JSVALUETREEREADER
