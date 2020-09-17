// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#include "pch.h"
#include "JsiWriter.h"
#ifdef __APPLE__
#include "Crash.h"
#else
#include <crash/verifyElseCrash.h>
#include "JsiReader.h"
#endif

namespace winrt::Microsoft::ReactNative {

//===========================================================================
// JsiWriter implementation
//===========================================================================

JsiWriter::JsiWriter(facebook::jsi::Runtime &runtime) noexcept : m_runtime(runtime) {
  Push({ContainerState::AcceptValueAndFinish});
}

facebook::jsi::Value JsiWriter::MoveResult() noexcept {
  VerifyElseCrash(m_containers.size() == 0);
  if (m_resultAsContainer.has_value()) {
    m_resultAsValue = ContainerToValue(std::move(ReadOptional(m_resultAsContainer)));
    m_resultAsContainer.reset();
  }
  return std::move(ReadOptional(m_resultAsValue));
}

void JsiWriter::AccessResultAsArgs(const facebook::jsi::Value *&args, size_t &count) noexcept {
  VerifyElseCrash(m_resultAsContainer.has_value());
  auto &container = ReadOptional(m_resultAsContainer);
  if (container.CurrentArrayElements.size() == 0) {
    args = nullptr;
    count = 0;
  } else {
    args = &container.CurrentArrayElements[0];
    count = container.CurrentArrayElements.size();
  }
}

void JsiWriter::WriteNull() noexcept {
  WriteValue(facebook::jsi::Value::null());
}

void JsiWriter::WriteBoolean(bool value) noexcept {
  WriteValue({value});
}

void JsiWriter::WriteInt64(int64_t value) noexcept {
  WriteValue({static_cast<double>(value)});
}

void JsiWriter::WriteDouble(double value) noexcept {
  WriteValue({value});
}

void JsiWriter::WriteString(const winrt::hstring &value) noexcept {
  WriteValue({m_runtime, facebook::jsi::String::createFromUtf8(m_runtime, winrt::to_string(value))});
}

void JsiWriter::WriteObjectBegin() noexcept {
  // legal to create an object when it is accepting a value
  VerifyElseCrash(Top().State != ContainerState::AcceptPropertyName);
  Push({ContainerState::AcceptPropertyName, facebook::jsi::Object(m_runtime)});
}

void JsiWriter::WritePropertyName(const winrt::hstring &name) noexcept {
  // legal to set a property name only when AcceptPropertyName
  auto &top = Top();
  VerifyElseCrash(top.State == ContainerState::AcceptPropertyName);
  top.State = ContainerState::AcceptPropertyValue;
  top.PropertyName = winrt::to_string(name);
}

void JsiWriter::WriteObjectEnd() noexcept {
  // legal to finish an object only when AcceptPropertyName
  VerifyElseCrash(Top().State == ContainerState::AcceptPropertyName);
  WriteContainer(Pop());
}

void JsiWriter::WriteArrayBegin() noexcept {
  // legal to create an array only when it is accepting a value
  VerifyElseCrash(Top().State != ContainerState::AcceptPropertyName);
  Push({ContainerState::AcceptArrayElement});
}

void JsiWriter::WriteArrayEnd() noexcept {
  // legal to finish an array only when AcceptArrayElement
  VerifyElseCrash(Top().State == ContainerState::AcceptArrayElement);
  WriteContainer(Pop());
}

facebook::jsi::Value JsiWriter::ContainerToValue(Container &&container) noexcept {
  switch (container.State) {
    case ContainerState::AcceptPropertyName: {
      return std::move(ReadOptional(container.CurrentObject));
    }
    case ContainerState::AcceptArrayElement: {
      facebook::jsi::Array createdArray(m_runtime, container.CurrentArrayElements.size());
      for (size_t i = 0; i < container.CurrentArrayElements.size(); i++) {
        createdArray.setValueAtIndex(m_runtime, i, std::move(container.CurrentArrayElements.at(i)));
      }
      return std::move(createdArray);
    }
    default:
      VerifyElseCrash(false);
  }
}

void JsiWriter::WriteContainer(Container &&container) noexcept {
  if (Top().State == ContainerState::AcceptValueAndFinish && container.State == ContainerState::AcceptArrayElement) {
    m_resultAsContainer.emplace(std::move(container));
    Pop();
    VerifyElseCrash(m_containers.size() == 0);
  } else {
    WriteValue(ContainerToValue(std::move(container)));
  }
}

void JsiWriter::WriteValue(facebook::jsi::Value &&value) noexcept {
  auto &top = Top();
  switch (top.State) {
    case ContainerState::AcceptValueAndFinish: {
      m_resultAsValue = std::move(value);
      Pop();
      VerifyElseCrash(m_containers.size() == 0);
      break;
    }
    case ContainerState::AcceptArrayElement: {
      top.CurrentArrayElements.push_back(std::move(value));
      break;
    }
    case ContainerState::AcceptPropertyValue: {
      auto &createdObject = ReadOptional(top.CurrentObject);
      createdObject.setProperty(m_runtime, top.PropertyName.c_str(), std::move(value));
      top.State = ContainerState::AcceptPropertyName;
      top.PropertyName = {};
      break;
    }
    default:
      VerifyElseCrash(false);
  }
}

JsiWriter::Container &JsiWriter::Top() noexcept {
  VerifyElseCrash(m_containers.size() > 0);
  return m_containers[m_containers.size() - 1];
}

JsiWriter::Container JsiWriter::Pop() noexcept {
  auto top = std::move(Top());
  m_containers.pop_back();
  return top;
}

void JsiWriter::Push(Container &&container) noexcept {
  m_containers.push_back(std::move(container));
}

/*static*/ facebook::jsi::Value JsiWriter::ToJsiValue(
    facebook::jsi::Runtime &runtime,
    JSValueArgWriter const &argWriter) noexcept {
  if (argWriter) {
    IJSValueWriter jsiWriter = winrt::make<JsiWriter>(runtime);
    argWriter(jsiWriter);
    return jsiWriter.as<JsiWriter>()->MoveResult();
  }

  return {};
}

} // namespace winrt::Microsoft::ReactNative
