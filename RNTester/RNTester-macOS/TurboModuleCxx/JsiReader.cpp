// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#include "pch.h"
#include "JsiReader.h"
#ifdef __APPLE__
#include "Crash.h"
#else
#include <crash/verifyElseCrash.h>
#endif

namespace winrt::Microsoft::ReactNative {

//===========================================================================
// JsiReader implementation
//===========================================================================

JsiReader::JsiReader(facebook::jsi::Runtime &runtime, const facebook::jsi::Value &root) noexcept : m_runtime(runtime) {
  SetValue(root);
}

JsiReader::JsiReader(facebook::jsi::Runtime &runtime, const facebook::jsi::Value *args, size_t count) noexcept
    : m_runtime(runtime) {
  m_containers.push_back({args, count});
}

JSValueType JsiReader::ValueType() noexcept {
  if (m_currentPrimitiveValue) {
    if (ReadOptional(m_currentPrimitiveValue).isString()) {
      return JSValueType::String;
    } else if (ReadOptional(m_currentPrimitiveValue).isBool()) {
      return JSValueType::Boolean;
    } else if (ReadOptional(m_currentPrimitiveValue).isNumber()) {
      double number = ReadOptional(m_currentPrimitiveValue).getNumber();

      // unfortunately JSI doesn't differentiate int and double
      // here we test if the double value can be converted to int without data loss
      // treat it like an int if we succeeded

      if (floor(number) == number) {
        return JSValueType::Int64;
      } else {
        return JSValueType::Double;
      }
    }
  } else if (m_containers.size() > 0) {
    return m_containers[m_containers.size() - 1].Type == ContainerType::Object ? JSValueType::Object
                                                                               : JSValueType::Array;
  }
  return JSValueType::Null;
}

bool JsiReader::GetNextObjectProperty(hstring &propertyName) noexcept {
  if (m_containers.size() == 0) {
    return false;
  }

  auto &top = m_containers[m_containers.size() - 1];
  if (top.Type != ContainerType::Object) {
    return false;
  }

  top.Index++;
  if (top.Index < static_cast<int>(ReadOptional(top.PropertyNames).size(m_runtime))) {
    auto propertyId =
        ReadOptional(top.PropertyNames).getValueAtIndex(m_runtime, static_cast<size_t>(top.Index)).getString(m_runtime);
    propertyName = winrt::to_hstring(propertyId.utf8(m_runtime));
    SetValue(ReadOptional(top.CurrentObject).getProperty(m_runtime, propertyId));
    return true;
  } else {
    m_containers.pop_back();
    m_currentPrimitiveValue.reset();
    return false;
  }
}

bool JsiReader::GetNextArrayItem() noexcept {
  if (m_containers.size() == 0) {
    return false;
  }

  auto &top = m_containers[m_containers.size() - 1];
  if (top.Type == ContainerType::Object) {
    return false;
  }

  top.Index++;

  switch (top.Type) {
    case ContainerType::Array: {
      if (top.Index < static_cast<int>(ReadOptional(top.CurrentArray).size(m_runtime))) {
        SetValue(ReadOptional(top.CurrentArray).getValueAtIndex(m_runtime, static_cast<size_t>(top.Index)));
        return true;
      }
      break;
    }
    case ContainerType::Args: {
      if (top.Index < static_cast<int>(top.ArgLength)) {
        SetValue({m_runtime, top.ArgElements[top.Index]});
        return true;
      }
      break;
    }
    default: {
      assert(false); // should never get here
    }
  }

  m_containers.pop_back();
  m_currentPrimitiveValue.reset();
  return false;
}

hstring JsiReader::GetString() noexcept {
  if (ValueType() != JSValueType::String) {
    return {};
  }
  return winrt::to_hstring(ReadOptional(m_currentPrimitiveValue).getString(m_runtime).utf8(m_runtime));
}

bool JsiReader::GetBoolean() noexcept {
  if (ValueType() != JSValueType::Boolean) {
    return false;
  }
  return ReadOptional(m_currentPrimitiveValue).getBool();
}

int64_t JsiReader::GetInt64() noexcept {
  if (ValueType() != JSValueType::Int64) {
    return 0;
  }
  return static_cast<int64_t>(ReadOptional(m_currentPrimitiveValue).getNumber());
}

double JsiReader::GetDouble() noexcept {
  auto valueType = ValueType();
  if (valueType != JSValueType::Int64 && valueType != JSValueType::Double) {
    return 0;
  }
  return ReadOptional(m_currentPrimitiveValue).getNumber();
}

void JsiReader::SetValue(const facebook::jsi::Value &value) noexcept {
  if (value.isObject()) {
    auto obj = value.getObject(m_runtime);
    if (obj.isArray(m_runtime)) {
      m_containers.push_back(obj.getArray(m_runtime));
    } else {
      m_containers.push_back({m_runtime, std::move(obj)});
    }
    m_currentPrimitiveValue = std::nullopt;
  } else if (value.isString() || value.isBool() || value.isNumber()) {
    m_currentPrimitiveValue = {m_runtime, value};
  } else {
    m_currentPrimitiveValue = facebook::jsi::Value::null();
  }
}

} // namespace winrt::Microsoft::ReactNative
