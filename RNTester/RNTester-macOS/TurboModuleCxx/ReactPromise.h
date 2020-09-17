// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#include "ReactError.h"
#include "winrt/Microsoft.ReactNative.h"

namespace winrt::Microsoft::ReactNative {

// ReactPromise represents a JavaScript Promise
// which can be passed to the native module as a method parameter.
//
// Methods with REACT_METHOD attribute that use an ReactPromise as the last parameter
// will be marked as "promise" and will return a promise when invoked from JavaScript.

// Base class that does not depend on template parameter T
struct ReactPromiseBase {
  ReactPromiseBase(
      IJSValueWriter const &writer,
      MethodResultCallback const &resolve,
      MethodResultCallback const &reject) noexcept;

  ~ReactPromiseBase() noexcept;

  // Report an Error.
  void Reject(ReactError const &error) const noexcept;
  void Reject(char const *errorMessage) const noexcept;
  void Reject(wchar_t const *errorMessage) const noexcept;

 protected:
  enum class State { Pending, Resolved, Rejected };

 protected:
  bool TrySetState(State newState) const noexcept;

 protected:
  const std::shared_ptr<std::atomic<State>> m_state;
  const IJSValueWriter m_writer;
  const MethodResultCallback m_resolve;
  const MethodResultCallback m_reject;
};

template <class T>
struct ReactPromise : ReactPromiseBase {
  using ReactPromiseBase::ReactPromiseBase;

  // Successfully resolve the IReactPromise with an optional value.
  void Resolve(T const &value) const noexcept;
};

template <>
struct ReactPromise<void> : ReactPromiseBase {
  using ReactPromiseBase::ReactPromiseBase;

  // Successfully resolve the IReactPromise with an optional value.
  void Resolve() const noexcept;
};

// Successfully resolve the ReactPromise with an optional value.
template <class T>
void ReactPromise<T>::Resolve(T const &value) const noexcept {
  if (TrySetState(State::Resolved) && m_resolve) {
    WriteArgs(m_writer, value);
    m_resolve(m_writer);
  }
}

} // namespace winrt::Microsoft::ReactNative
