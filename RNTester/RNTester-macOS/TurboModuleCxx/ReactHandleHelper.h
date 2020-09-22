// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_REACTHANDLEHELPER
#define MICROSOFT_REACTNATIVE_REACTHANDLEHELPER

//
// Helper methods for types that have Handle() method that return
// an IInspectable-inherited value.
//

#include <winrt/Microsoft.ReactNative.h>
#include <type_traits>

namespace winrt::Microsoft::ReactNative {

namespace Internal {
template <class T>
auto TestHandle(int) -> decltype(std::declval<T>().Handle());
template <class>
auto TestHandle(int *) -> void;
} // namespace Internal

template <class T>
inline constexpr bool HasHandleV =
    std::is_base_of_v<Windows::Foundation::IInspectable, std::decay_t<decltype(Internal::TestHandle<T>(0))>>;

// True if two types with Handle() have the same handle.
template <class T, std::enable_if_t<HasHandleV<T>, int> = 0>
inline bool operator==(T const &left, T const &right) noexcept {
  return left.Handle() == right.Handle();
}

// True if two types with Handle() have different handles.
template <class T, std::enable_if_t<HasHandleV<T>, int> = 0>
inline bool operator!=(T const &left, T const &right) noexcept {
  return !(left.Handle() == right.Handle());
}

// True if handle of left is null.
template <class T, std::enable_if_t<HasHandleV<T>, int> = 0>
inline bool operator==(T const &left, std::nullptr_t) noexcept {
  return !static_cast<bool>(left.Handle());
}

// True if handle of left is not null.
template <class T, std::enable_if_t<HasHandleV<T>, int> = 0>
inline bool operator!=(T const &left, std::nullptr_t) noexcept {
  return static_cast<bool>(left.Handle());
}

// True if handle of right is null.
template <class T, std::enable_if_t<HasHandleV<T>, int> = 0>
inline bool operator==(std::nullptr_t, T const &right) noexcept {
  return !static_cast<bool>(right.Handle());
}

// True if handle of left is not null.
template <class T, std::enable_if_t<HasHandleV<T>, int> = 0>
inline bool operator!=(std::nullptr_t, T const &right) noexcept {
  return static_cast<bool>(right.Handle());
}

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_REACTHANDLEHELPER
