// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_JSVALUEWRITER
#define MICROSOFT_REACTNATIVE_JSVALUEWRITER

#include <winrt/Microsoft.ReactNative.h>
#include "JSValue.h"
#include "StructInfo.h"

namespace winrt::Microsoft::ReactNative {

//==============================================================================
// IJSValueWriter extensions forward declarations
//==============================================================================

void WriteValue(IJSValueWriter const &writer, std::nullptr_t) noexcept;
template <class T, std::enable_if_t<std::is_convertible_v<T, std::string_view>, int> = 1>
void WriteValue(IJSValueWriter const &writer, T const &value) noexcept;
template <class T, std::enable_if_t<std::is_convertible_v<T, std::wstring_view>, int> = 1>
void WriteValue(IJSValueWriter const &writer, T const &value) noexcept;
void WriteValue(IJSValueWriter const &writer, bool value) noexcept;
void WriteValue(IJSValueWriter const &writer, int8_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, int16_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, int32_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, int64_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, uint8_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, uint16_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, uint32_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, uint64_t value) noexcept;
void WriteValue(IJSValueWriter const &writer, float value) noexcept;
void WriteValue(IJSValueWriter const &writer, double value) noexcept;
template <class T, std::enable_if_t<std::is_enum_v<T>, int> = 1>
void WriteValue(IJSValueWriter const &writer, T const &value) noexcept;
template <class T>
void WriteValue(IJSValueWriter const &writer, std::optional<T> const &value) noexcept;
template <class T, class TCompare = std::less<>, class TAlloc = std::allocator<std::pair<const std::string, T>>>
void WriteValue(IJSValueWriter const &writer, std::map<std::string, T, TCompare, TAlloc> const &value) noexcept;
template <class T, class TCompare = std::less<>, class TAlloc = std::allocator<std::pair<const std::string, T>>>
void WriteValue(IJSValueWriter const &writer, std::map<std::wstring, T, TCompare, TAlloc> const &value) noexcept;
template <class T, class TAlloc = std::allocator<T>>
void WriteValue(IJSValueWriter const &writer, std::vector<T, TAlloc> const &value) noexcept;
template <class... Ts>
void WriteValue(IJSValueWriter const &writer, std::tuple<Ts...> const &value) noexcept;

void WriteValue(IJSValueWriter const &writer, JSValue const &value) noexcept;
void WriteValue(IJSValueWriter const &writer, JSValueObject const &value) noexcept;
void WriteValue(IJSValueWriter const &writer, JSValueArray const &value) noexcept;

template <class T, std::enable_if_t<!std::is_void_v<decltype(GetStructInfo(static_cast<T *>(nullptr)))>, int> = 1>
void WriteValue(IJSValueWriter const &writer, T const &value) noexcept;

template <class T>
void WriteProperty(IJSValueWriter const &writer, std::string_view propertyName, T const &value) noexcept;
template <class T>
void WriteProperty(IJSValueWriter const &writer, std::wstring_view propertyName, T const &value) noexcept;
template <class T>
void WriteProperties(IJSValueWriter const &writer, T const &value) noexcept;

template <class... TArgs>
void WriteArgs(IJSValueWriter const &writer, TArgs const &... args) noexcept;

template <class... TArgs>
JSValueArgWriter MakeJSValueArgWriter(TArgs &&... args) noexcept;

IJSValueWriter MakeJSValueTreeWriter() noexcept;

//==============================================================================
// IJSValueWriter extensions implementation
//==============================================================================

inline void WriteValue(IJSValueWriter const &writer, std::nullptr_t) noexcept {
  writer.WriteNull();
}

template <class T, std::enable_if_t<std::is_convertible_v<T, std::string_view>, int>>
inline void WriteValue(IJSValueWriter const &writer, T const &value) noexcept {
  writer.WriteString(to_hstring(value));
}

template <class T, std::enable_if_t<std::is_convertible_v<T, std::wstring_view>, int>>
inline void WriteValue(IJSValueWriter const &writer, T const &value) noexcept {
  writer.WriteString(value);
}

inline void WriteValue(IJSValueWriter const &writer, bool value) noexcept {
  writer.WriteBoolean(value);
}

inline void WriteValue(IJSValueWriter const &writer, int8_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, int16_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, int32_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, int64_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, uint8_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, uint16_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, uint32_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, uint64_t value) noexcept {
  writer.WriteInt64(value);
}

inline void WriteValue(IJSValueWriter const &writer, float value) noexcept {
  writer.WriteDouble(value);
}

inline void WriteValue(IJSValueWriter const &writer, double value) noexcept {
  writer.WriteDouble(value);
}

template <class T, std::enable_if_t<std::is_enum_v<T>, int>>
inline void WriteValue(IJSValueWriter const &writer, T const &value) noexcept {
  WriteValue(writer, static_cast<int32_t>(value));
}

template <class T>
inline void WriteValue(IJSValueWriter const &writer, std::optional<T> const &value) noexcept {
  if (value.has_value()) {
    WriteValue(writer, *value);
  } else {
    writer.WriteNull();
  }
}

template <class T, class TCompare, class TAlloc>
inline void WriteValue(IJSValueWriter const &writer, std::map<std::string, T, TCompare, TAlloc> const &value) noexcept {
  writer.WriteObjectBegin();
  for (const auto &entry : value) {
    WriteProperty(writer, entry.first, entry.second);
  }
  writer.WriteObjectEnd();
}

template <class T, class TCompare, class TAlloc>
inline void WriteValue(
    IJSValueWriter const &writer,
    std::map<std::wstring, T, TCompare, TAlloc> const &value) noexcept {
  writer.WriteObjectBegin();
  for (const auto &entry : value) {
    WriteProperty(writer, entry.first, entry.second);
  }
  writer.WriteObjectEnd();
}

template <class T, class TAlloc>
inline void WriteValue(IJSValueWriter const &writer, std::vector<T, TAlloc> const &value) noexcept {
  writer.WriteArrayBegin();
  for (const auto &item : value) {
    WriteValue(writer, item);
  }
  writer.WriteArrayEnd();
}

template <class T, size_t... I>
inline void WriteTuple(IJSValueWriter const &writer, T const &tuple, std::index_sequence<I...>) noexcept {
  WriteArgs(writer, std::get<I>(tuple)...);
}

template <class... Ts>
inline void WriteValue(IJSValueWriter const &writer, std::tuple<Ts...> const &value) noexcept {
  WriteTuple(writer, value, std::make_index_sequence<sizeof...(Ts)>{});
}

inline void WriteValue(IJSValueWriter const &writer, JSValue const &value) noexcept {
  value.WriteTo(writer);
}

inline void WriteValue(IJSValueWriter const &writer, JSValueObject const &value) noexcept {
  value.WriteTo(writer);
}

inline void WriteValue(IJSValueWriter const &writer, JSValueArray const &value) noexcept {
  value.WriteTo(writer);
}

inline void WriteCustomDirectEventTypeConstant(
    IJSValueWriter const &writer,
    std::wstring_view propertyName,
    std::wstring_view registrationName) noexcept {
  writer.WritePropertyName(propertyName);
  writer.WriteObjectBegin();
  WriteProperty(writer, L"registrationName", registrationName);
  writer.WriteObjectEnd();
}

inline void WriteCustomDirectEventTypeConstant(
    IJSValueWriter const &writer,
    std::string_view propertyName,
    std::string_view registrationName) noexcept {
  WriteCustomDirectEventTypeConstant(writer, to_hstring(propertyName), to_hstring(registrationName));
}

inline void WriteCustomDirectEventTypeConstant(IJSValueWriter const &writer, std::wstring_view eventName) noexcept {
  WriteCustomDirectEventTypeConstant(writer, L"top" + eventName, L"on" + eventName);
}

inline void WriteCustomDirectEventTypeConstant(IJSValueWriter const &writer, std::string_view eventName) noexcept {
  WriteCustomDirectEventTypeConstant(writer, L"top" + to_hstring(eventName), L"on" + to_hstring(eventName));
}

template <class T, std::enable_if_t<!std::is_void_v<decltype(GetStructInfo(static_cast<T *>(nullptr)))>, int>>
inline void WriteValue(IJSValueWriter const &writer, T const &value) noexcept {
  writer.WriteObjectBegin();
  for (const auto &fieldEntry : StructInfo<T>::FieldMap) {
    writer.WritePropertyName(fieldEntry.first);
    fieldEntry.second.WriteField(writer, &value);
  }
  writer.WriteObjectEnd();
}

template <class T>
inline void WriteProperty(IJSValueWriter const &writer, std::string_view propertyName, T const &value) noexcept {
  writer.WritePropertyName(to_hstring(propertyName));
  WriteValue(writer, value);
}

template <class T>
inline void WriteProperty(IJSValueWriter const &writer, std::wstring_view propertyName, T const &value) noexcept {
  writer.WritePropertyName(propertyName);
  WriteValue(writer, value);
}

template <class T>
inline void WriteProperties(IJSValueWriter const &writer, T const &value) noexcept {
  auto jsValueWriter = MakeJSValueTreeWriter();
  WriteValue(jsValueWriter, value);
  auto jsValue = TakeJSValue(jsValueWriter);
  for (auto &property : jsValue.AsObject()) {
    WriteProperty(writer, property.first, property.second);
  }
}

template <class... TArgs>
inline void WriteArgs(IJSValueWriter const &writer, TArgs const &... args) noexcept {
  writer.WriteArrayBegin();
  (WriteValue(writer, args), ...);
  writer.WriteArrayEnd();
}

template <class T, std::enable_if_t<std::is_invocable_v<T, IJSValueWriter const &>, int> = 0>
inline JSValueArgWriter MakeJSValueArgWriter(T &&argWriter) noexcept {
  return std::forward<T>(argWriter);
}

template <class... TArgs>
inline JSValueArgWriter MakeJSValueArgWriter(TArgs &&... args) noexcept {
  return [&args...](IJSValueWriter const &writer) noexcept {
    WriteArgs(writer, args...);
  };
}

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_JSVALUEWRITER
