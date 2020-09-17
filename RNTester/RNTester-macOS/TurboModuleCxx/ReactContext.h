// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_REACTCONTEXT
#define MICROSOFT_REACTNATIVE_REACTCONTEXT

#if !defined(CORE_ABI) && !defined(__APPLE__)
#include <CppWinRTIncludes.h>
#endif
#include <string_view>
#include "JSValueWriter.h"
#include "ReactNotificationService.h"
#include "ReactPropertyBag.h"

namespace winrt::Microsoft::ReactNative {

// Represents a context of execution for the Native Module.
// It wraps up the IReactContext and adds convenience methods for
// working with C++ types.
struct ReactContext {
  ReactContext(std::nullptr_t = nullptr) noexcept {}

  ReactContext(IReactContext const &handle) noexcept : m_handle{handle} {}

  IReactContext const &Handle() const noexcept {
    return m_handle;
  }

  explicit operator bool() const noexcept {
    return m_handle ? true : false;
  }

  ReactPropertyBag Properties() const noexcept {
    return ReactPropertyBag{m_handle.Properties()};
  }

  ReactNotificationService Notifications() const noexcept {
    return ReactNotificationService{m_handle.Notifications()};
  }

  ReactDispatcher UIDispatcher() const noexcept {
    return ReactDispatcher{m_handle.UIDispatcher()};
  }

  ReactDispatcher JSDispatcher() const noexcept {
    return ReactDispatcher{m_handle.JSDispatcher()};
  }

  // Call methodName JS function of module with moduleName.
  // args are either function arguments or a single lambda with 'IJSValueWriter const&' argument.
  template <class... TArgs>
  void CallJSFunction(std::wstring_view moduleName, std::wstring_view methodName, TArgs &&... args) const noexcept {
    m_handle.CallJSFunction(moduleName, methodName, MakeJSValueArgWriter(std::forward<TArgs>(args)...));
  }

  // Simplifies calls to CallJSFunction to emit events (method named 'emit').
  // Call eventName JS event of module with eventEmitterName.
  // args are either function arguments or a single lambda with 'IJSValueWriter const&' argument.
  template <class... TArgs>
  void EmitJSEvent(std::wstring_view eventEmitterName, std::wstring_view eventName, TArgs &&... args) const noexcept {
    m_handle.EmitJSEvent(eventEmitterName, eventName, MakeJSValueArgWriter(std::forward<TArgs>(args)...));
  }

#if !defined(CORE_ABI) && !defined(__APPLE__)
  // Dispatch eventName event to the view.
  // args are either function arguments or a single lambda with 'IJSValueWriter const&' argument.
  template <class... TArgs>
  void DispatchEvent(xaml::FrameworkElement const &view, std::wstring_view eventName, TArgs &&... args) const noexcept {
    m_handle.DispatchEvent(view, eventName, MakeJSValueArgWriter(std::forward<TArgs>(args)...));
  }
#endif

  friend bool operator==(ReactContext const &left, ReactContext const &right) noexcept {
    return left.m_handle == right.m_handle;
  }

  friend bool operator!=(ReactContext const &left, ReactContext const &right) noexcept {
    return left.m_handle != right.m_handle;
  }

  friend bool operator==(ReactContext const &left, std::nullptr_t) noexcept {
    return !static_cast<bool>(left.m_handle);
  }

  friend bool operator!=(ReactContext const &left, std::nullptr_t) noexcept {
    return static_cast<bool>(left.m_handle);
  }

  friend bool operator==(std::nullptr_t, ReactContext const &right) noexcept {
    return !static_cast<bool>(right.m_handle);
  }

  friend bool operator!=(std::nullptr_t, ReactContext const &right) noexcept {
    return static_cast<bool>(right.m_handle);
  }

 private:
  IReactContext m_handle;
};

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_REACTCONTEXT
