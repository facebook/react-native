// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once

#include "jsi/jsi.h"
#include "winrt/Microsoft.ReactNative.h"

namespace winrt::Microsoft::ReactNative {

struct JsiWriter : winrt::implements<JsiWriter, IJSValueWriter> {
  JsiWriter(facebook::jsi::Runtime &runtime) noexcept;

  // MoveResult crashes when the root object is not closed.
  // MoveResult returns the constructed root object.
  facebook::jsi::Value MoveResult() noexcept;

  // AccessResultAsArgs crashes when the root object is not closed.
  // AccessResultAsArgs crashes when the root object is not an array.
  // AccessResultAsArgs gives you elements of the written array directly.
  void AccessResultAsArgs(const facebook::jsi::Value *&args, size_t &count) noexcept;

 public: // IJSValueWriter
  void WriteNull() noexcept;
  void WriteBoolean(bool value) noexcept;
  void WriteInt64(int64_t value) noexcept;
  void WriteDouble(double value) noexcept;
  void WriteString(const winrt::hstring &value) noexcept;
  void WriteObjectBegin() noexcept;
  void WritePropertyName(const winrt::hstring &name) noexcept;
  void WriteObjectEnd() noexcept;
  void WriteArrayBegin() noexcept;
  void WriteArrayEnd() noexcept;

 public:
  static facebook::jsi::Value ToJsiValue(facebook::jsi::Runtime &runtime, JSValueArgWriter const &argWriter) noexcept;

 private:
  enum class ContainerState {
    AcceptValueAndFinish,
    AcceptArrayElement,
    AcceptPropertyName,
    AcceptPropertyValue,
  };

  struct Container {
    ContainerState State;
    std::optional<facebook::jsi::Object> CurrentObject;
    std::vector<facebook::jsi::Value> CurrentArrayElements;
    std::string PropertyName;

    Container(ContainerState state) noexcept : State(state) {}
    Container(ContainerState state, facebook::jsi::Object &&value) noexcept
        : State(state), CurrentObject(std::move(value)) {}

    Container(const Container &) = delete;
    Container(Container &&) = default;
  };

 private:
  facebook::jsi::Value ContainerToValue(Container &&container) noexcept;
  void WriteContainer(Container &&container) noexcept;
  void WriteValue(facebook::jsi::Value &&value) noexcept;
  Container &Top() noexcept;
  Container Pop() noexcept;
  void Push(Container &&container) noexcept;

 private:
  facebook::jsi::Runtime &m_runtime;
  // m_containers represents a stack of constructing objects.
  // when the root object is not closed, the bottom container in m_containers is ContainerState::AcceptValueAndFinish.
  // when the root object is closed, m_containers will be empty, m_resultAsValue or m_resultAsContainer will be written.
  // m_resultAsContainer is available when the root object is an array.
  // MoveResult or AccessResultAsArgs is ready to use when the root object is closed.
  std::optional<facebook::jsi::Value> m_resultAsValue;
  std::optional<Container> m_resultAsContainer;
  std::vector<Container> m_containers;
};

} // namespace winrt::Microsoft::ReactNative
