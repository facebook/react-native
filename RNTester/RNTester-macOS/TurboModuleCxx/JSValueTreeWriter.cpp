// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#include "pch.h"
#include "JSValueTreeWriter.h"
#include "Crash.h"

namespace winrt::Microsoft::ReactNative {

//===========================================================================
// JSValueTreeWriter implementation
//===========================================================================

JSValueTreeWriter::JSValueTreeWriter() noexcept {
  m_containerStack.push(ContainerInfo{ContainerType::None});
}

JSValue JSValueTreeWriter::TakeValue() noexcept {
  return std::move(m_resultValue);
}

void JSValueTreeWriter::WriteNull() noexcept {
  WriteValue(JSValue{});
}

void JSValueTreeWriter::WriteBoolean(bool value) noexcept {
  WriteValue(JSValue{value});
}

void JSValueTreeWriter::WriteInt64(int64_t value) noexcept {
  WriteValue(JSValue{value});
}

void JSValueTreeWriter::WriteDouble(double value) noexcept {
  WriteValue(JSValue{value});
}

void JSValueTreeWriter::WriteString(const hstring &value) noexcept {
  WriteValue(JSValue{to_string(value)});
}

void JSValueTreeWriter::WriteObjectBegin() noexcept {
  m_containerStack.push(ContainerInfo{ContainerType::Object});
}

void JSValueTreeWriter::WritePropertyName(const winrt::hstring &name) noexcept {
  auto &top = m_containerStack.top();
  VerifyElseCrash(top.Type == ContainerType::Object);
  top.PropertyName = to_string(name);
}

void JSValueTreeWriter::WriteObjectEnd() noexcept {
  auto &top = m_containerStack.top();
  VerifyElseCrash(top.Type == ContainerType::Object);
  JSValue value{std::move(top.Object)};
  m_containerStack.pop();
  WriteValue(std::move(value));
}

void JSValueTreeWriter::WriteArrayBegin() noexcept {
  m_containerStack.push(ContainerInfo{ContainerType::Array});
}

void JSValueTreeWriter::WriteArrayEnd() noexcept {
  auto &top = m_containerStack.top();
  VerifyElseCrash(top.Type == ContainerType::Array);
  JSValue value{std::move(top.Array)};
  m_containerStack.pop();
  WriteValue(std::move(value));
}

void JSValueTreeWriter::WriteValue(JSValue &&value) noexcept {
  auto &top = m_containerStack.top();
  switch (top.Type) {
    case ContainerType::None:
      m_resultValue = std::move(value);
      break;
    case ContainerType::Object:
      top.Object.emplace(std::move(top.PropertyName), std::move(value));
      break;
    case ContainerType::Array:
      top.Array.push_back(std::move(value));
      break;
  }
}

IJSValueWriter MakeJSValueTreeWriter() noexcept {
  return make<JSValueTreeWriter>();
}

JSValue TakeJSValue(IJSValueWriter const &writer) noexcept {
  return get_self<JSValueTreeWriter>(writer)->TakeValue();
}

} // namespace winrt::Microsoft::ReactNative
