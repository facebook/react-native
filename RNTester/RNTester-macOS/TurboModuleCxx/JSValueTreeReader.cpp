// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#include "pch.h"
#include "JSValueTreeReader.h"

namespace winrt::Microsoft::ReactNative {

//===========================================================================
// JSValueTreeReader implementation
//===========================================================================

JSValueTreeReader::StackEntry::StackEntry(const JSValue &value, const JSValueObject::const_iterator &property) noexcept
    : Value{value}, Property{property} {}

JSValueTreeReader::StackEntry::StackEntry(const JSValue &value, const JSValueArray::const_iterator &item) noexcept
    : Value{value}, Item{item} {}

JSValueTreeReader::JSValueTreeReader(const JSValue &value) noexcept : m_root{value}, m_current{&value} {}

JSValueTreeReader::JSValueTreeReader(JSValue &&value) noexcept
    : m_ownedValue{std::move(value)}, m_root{m_ownedValue}, m_current{&m_ownedValue} {}

JSValueType JSValueTreeReader::ValueType() noexcept {
  return m_current->Type();
}

bool JSValueTreeReader::GetNextObjectProperty(hstring &propertyName) noexcept {
  if (!m_isInContainer) {
    if (auto obj = m_current->TryGetObject()) {
      const auto &properties = *obj;
      const auto &property = properties.begin();
      if (property != properties.end()) {
        m_stack.emplace_back(*m_current, property);
        SetCurrentValue(property->second);
        propertyName = to_hstring(property->first);
        return true;
      } else {
        m_isInContainer = !m_stack.empty();
      }
    }
  } else if (!m_stack.empty()) {
    auto &entry = m_stack.back();
    if (auto obj = entry.Value.TryGetObject()) {
      auto &property = entry.Property;
      if (++property != obj->end()) {
        SetCurrentValue(property->second);
        propertyName = to_hstring(property->first);
        return true;
      } else {
        m_current = &entry.Value;
        m_stack.pop_back();
        m_isInContainer = !m_stack.empty();
      }
    }
  }

  propertyName = to_hstring(L"");
  return false;
}

bool JSValueTreeReader::GetNextArrayItem() noexcept {
  if (!m_isInContainer) {
    if (auto arr = m_current->TryGetArray()) {
      const auto &item = arr->begin();
      if (item != arr->end()) {
        m_stack.emplace_back(*m_current, item);
        SetCurrentValue(*item);
        return true;
      } else {
        m_isInContainer = !m_stack.empty();
      }
    }
  } else if (!m_stack.empty()) {
    auto &entry = m_stack.back();
    if (auto arr = entry.Value.TryGetArray()) {
      if (++entry.Item != arr->end()) {
        SetCurrentValue(*entry.Item);
        return true;
      } else {
        m_current = &entry.Value;
        m_stack.pop_back();
        m_isInContainer = !m_stack.empty();
      }
    }
  }

  return false;
}

void JSValueTreeReader::SetCurrentValue(const JSValue &value) noexcept {
  m_current = &value;
  switch (value.Type()) {
    case JSValueType::Object:
    case JSValueType::Array:
      m_isInContainer = false;
      break;
    default:
      m_isInContainer = true;
      break;
  }
}

hstring JSValueTreeReader::GetString() noexcept {
  auto s = m_current->TryGetString();
  return to_hstring(s ? *s : "");
}

bool JSValueTreeReader::GetBoolean() noexcept {
  auto b = m_current->TryGetBoolean();
  return b ? *b : false;
}

int64_t JSValueTreeReader::GetInt64() noexcept {
  auto i = m_current->TryGetInt64();
  return i ? *i : 0;
}

double JSValueTreeReader::GetDouble() noexcept {
  auto d = m_current->TryGetDouble();
  return d ? *d : 0;
}

IJSValueReader MakeJSValueTreeReader(const JSValue &root) noexcept {
  return make<JSValueTreeReader>(root);
}

IJSValueReader MakeJSValueTreeReader(JSValue &&root) noexcept {
  return make<JSValueTreeReader>(std::move(root));
}

} // namespace winrt::Microsoft::ReactNative
