// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_REACTNONABIVALUE
#define MICROSOFT_REACTNATIVE_REACTNONABIVALUE

#include <winrt/Microsoft.ReactNative.h>
#include <utility>

namespace winrt::Microsoft::ReactNative {

namespace implementation {

// The ReactNonAbiValue implementation that wraps up the non-ABI safe value.
// This class is created by winrt::Microsoft::ReactNative::ReactNonAbiValue constructor
// that accepts std::in_place of type std::in_place_t as the first parameter.
template <class T>
struct ReactNonAbiValue : implements<ReactNonAbiValue<T>, IReactNonAbiValue> {
  // Create ReactNonAbiValue and construct the wrapped value.
  template <class... TArgs>
  ReactNonAbiValue(TArgs &&... args) noexcept : m_value{std::forward<TArgs>(args)...} {}

  // Get a pointer to the wrapped value.
  int64_t GetPtr() const noexcept {
    return reinterpret_cast<int64_t>(&m_value);
  }

 private:
  T m_value{}; // Wrapped non-ABI value.
};

} // namespace implementation

// Use this class to work with non-ABI value wrappers.
// This class is a smart pointer to the implementation::ReactNonAbiValue which is
// ref-counted and allocated in the heap. The ReactNonAbiValue should be used as if
// it would be a winrt::com_ptr<implementation::ReactNonAbiValue>. It has the same behavior in regards
// to copy/move semantic.
// Use the constructor that accepts std::in_place of type std::in_place_t as the first parameter to allocate
// a new instance of implementation::ReactNonAbiValue. The std::in_place allows to disambiguate the calls to
// other constructors.
template <class T>
struct ReactNonAbiValue : Windows::Foundation::IInspectable {
  // Create a new instance of implementation::ReactNonAbiValue with args and keep a ref-counted pointer to it.
  template <class... TArgs>
  ReactNonAbiValue(std::in_place_t, TArgs &&... args) noexcept
      : IInspectable{make<implementation::ReactNonAbiValue<T>>(std::forward<TArgs>(args)...)} {}

  // Create an empty ReactNonAbiValue.
  ReactNonAbiValue(std::nullptr_t = nullptr) noexcept {}

  // Create a ReactNonAbiValue with taking the onwership from the provided pointer.
  ReactNonAbiValue(void *ptr, take_ownership_from_abi_t) noexcept : IInspectable(ptr, take_ownership_from_abi) {}

  // Get a pointer to the value from the object it implements IReactNonAbiValue.
  // The method is unsafe because it provides no protection in case if the object has a value of different type.
  // Treat this method as if you would cast to a value type from 'void*' type.
  // The method returns nullptr if obj doe snot implement the IReactNonAbiValue interface.
  static T *GetPtrUnsafe(IInspectable const &obj) noexcept {
    if (IReactNonAbiValue temp = obj.try_as<IReactNonAbiValue>()) {
      return reinterpret_cast<T *>(temp.GetPtr());
    } else {
      return nullptr;
    }
  }

  // Get pointer to the stored value.
  // Return nullptr if ReactNonAbiValue is empty.
  T *GetPtr() const noexcept {
    if (IReactNonAbiValue const &temp =
            *static_cast<IReactNonAbiValue const *>(static_cast<IInspectable const *>(this))) {
      return reinterpret_cast<T *>(temp.GetPtr());
    } else {
      return nullptr;
    }
  }

  // Get pointer to the stored value.
  // Return nullptr if ReactNonAbiValue is empty.
  T *operator->() const noexcept {
    return GetPtr();
  }

  // Get a reference to the stored value.
  // Crash the app if ReactNonAbiValue is empty.
  T &operator*() const noexcept {
    return *GetPtr();
  }

  // Get a reference to the stored value.
  // Crash the app if ReactNonAbiValue is empty.
  T &Value() const noexcept {
    return *GetPtr();
  }

  // Call the call operator() for the stored value.
  // Crash the app if ReactNonAbiValue is empty.
  template <class... TArgs>
  auto operator()(TArgs &&... args) const {
    return (*GetPtr())(std::forward<TArgs>(args)...);
  }
};

// Type traits to check if type T is a IsReactNonAbiValue.
template <class T>
struct IsReactNonAbiValue : std::false_type {};
template <class T>
struct IsReactNonAbiValue<ReactNonAbiValue<T>> : std::true_type {};

// A shortcut for the value of the IsReactNonAbiValue type traits.
template <class T>
constexpr bool IsReactNonAbiValueV = IsReactNonAbiValue<T>::value;

} // namespace winrt::Microsoft::ReactNative

#ifndef __APPLE__
namespace winrt::impl {
// C++/WinRT binding to connect ReactNonAbiValue with the IReactNonAbiValue interface.
template <class T>
struct default_interface<Microsoft::ReactNative::ReactNonAbiValue<T>> {
  using type = Microsoft::ReactNative::IReactNonAbiValue;
};
} // namespace winrt::impl
#endif

#endif // MICROSOFT_REACTNATIVE_REACTNONABIVALUE
