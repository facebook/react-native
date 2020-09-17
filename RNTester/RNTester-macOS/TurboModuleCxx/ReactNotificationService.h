// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
// IMPORTANT: Before updating this file
// please read react-native-windows repo:
// vnext/Microsoft.ReactNative.Cxx/README.md

#pragma once
#ifndef MICROSOFT_REACTNATIVE_REACTNOTIFICATIONSERVICE
#define MICROSOFT_REACTNATIVE_REACTNOTIFICATIONSERVICE

#include "ReactDispatcher.h"
#include "ReactPropertyBag.h"

namespace winrt::Microsoft::ReactNative {

// Encapsulates the IReactPropertyName and the notification data type
template <class T>
struct ReactNotificationId : ReactPropertyName {
  using NotificationDataType = T;
  using ReactPropertyName::ReactPropertyName;

  ReactPropertyName const &NotificationName() const noexcept {
    return *this;
  }
};

struct ReactNotificationSubscription {
  ReactNotificationSubscription(std::nullptr_t = nullptr) noexcept {}

  explicit ReactNotificationSubscription(IReactNotificationSubscription const &handle) noexcept : m_handle{handle} {}

  IReactNotificationSubscription const &Handle() const noexcept {
    return m_handle;
  }

  explicit operator bool() const noexcept {
    return m_handle ? true : false;
  }

  ReactDispatcher Dispatcher() const noexcept {
    return ReactDispatcher{m_handle ? m_handle.Dispatcher() : nullptr};
  }

  // Name of the notification.
  ReactPropertyName NotificationName() const noexcept {
    return ReactPropertyName{m_handle ? m_handle.NotificationName() : nullptr};
  };

  // True if the subscription is still active.
  // This property is checked before notification handler is invoked.
  bool IsSubscribed() const noexcept {
    return m_handle ? m_handle.IsSubscribed() : false;
  };

  // Remove the subscription.
  // Because of the multi-threaded nature of the notifications, the handler can be still called
  // after the Unsubscribe method called if the IsSubscribed property is already checked.
  // Consider calling the Unsubscribe method and the handler in the same IReactDispatcher
  // to ensure that no handler is invoked after the Unsubscribe method call.
  void Unsubscribe() const noexcept {
    if (m_handle) {
      m_handle.Unsubscribe();
    }
  }

 private:
  IReactNotificationSubscription m_handle;
};

struct ReactNotificationSubscriptionRevoker : ReactNotificationSubscription {
  ReactNotificationSubscriptionRevoker(std::nullptr_t = nullptr) noexcept : ReactNotificationSubscription{nullptr} {}

  explicit ReactNotificationSubscriptionRevoker(IReactNotificationSubscription const &handle) noexcept
      : ReactNotificationSubscription{handle} {}

  ReactNotificationSubscriptionRevoker(ReactNotificationSubscriptionRevoker const &) = delete;
  ReactNotificationSubscriptionRevoker(ReactNotificationSubscriptionRevoker &&) = default;
  ReactNotificationSubscriptionRevoker &operator=(ReactNotificationSubscriptionRevoker const &) = delete;

  ReactNotificationSubscriptionRevoker &operator=(ReactNotificationSubscriptionRevoker &&other) noexcept {
    if (this != &other) {
      Unsubscribe();
      ReactNotificationSubscription::operator=(std::move(other));
    }

    return *this;
  }

  ~ReactNotificationSubscriptionRevoker() noexcept {
    Unsubscribe();
  }
};

struct ReactNotificationArgsBase {
  IReactNotificationArgs const &Handle() const noexcept {
    return m_handle;
  }

  explicit operator bool() const noexcept {
    return m_handle ? true : false;
  }

  ReactNotificationSubscription Subscription() const noexcept {
    return ReactNotificationSubscription{m_handle ? m_handle.Subscription() : nullptr};
  }

 protected:
  ReactNotificationArgsBase() = default;

  explicit ReactNotificationArgsBase(IReactNotificationArgs const &handle) noexcept : m_handle{handle} {}

 private:
  IReactNotificationArgs m_handle;
};

template <class T>
struct ReactNotificationArgs : ReactNotificationArgsBase {
  ReactNotificationArgs(std::nullptr_t = nullptr) noexcept {}

  explicit ReactNotificationArgs(IReactNotificationArgs const &handle) noexcept : ReactNotificationArgsBase{handle} {}

  auto Data() const noexcept {
    return ReactPropertyBag::FromObject<T>(Handle() ? Handle().Data() : nullptr);
  }
};

template <class THandle, class TData>
inline constexpr bool IsValidHandlerV =
    std::is_invocable_v<THandle, Windows::Foundation::IInspectable const &, ReactNotificationArgs<TData> const &>;

struct ReactNotificationService {
  // Notification data result type is either T or std::optional<T>.
  // T is returned for types inherited from IInspectable.
  // The std::optional<T> is returned for all other types.
  template <class T>
  using ResultType = std::conditional_t<std::is_base_of_v<Windows::Foundation::IInspectable, T>, T, std::optional<T>>;

  // Create a new empty instance of ReactNotificationService.
  ReactNotificationService(std::nullptr_t = nullptr) noexcept {}

  // Creates a new instance of ReactNotificationService with the provided handle.
  explicit ReactNotificationService(IReactNotificationService const &handle) noexcept : m_handle{handle} {}

  IReactNotificationService const &Handle() const noexcept {
    return m_handle;
  }

  explicit operator bool() const noexcept {
    return m_handle ? true : false;
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  static ReactNotificationSubscriptionRevoker Subscribe(
      IReactNotificationService const &handle,
      winrt::auto_revoke_t,
      ReactNotificationId<TData> const &notificationId,
      ReactDispatcher const &dispatcher,
      THandler &&handler) noexcept {
    IReactNotificationSubscription subscription = handle
        ? handle.Subscribe(
              notificationId.Handle(),
              dispatcher.Handle(),
              [handler = std::forward<THandler>(handler)](
                  Windows::Foundation::IInspectable const &sender, IReactNotificationArgs const &args) noexcept {
                handler(sender, ReactNotificationArgs<TData>{args});
              })
        : nullptr;
    return ReactNotificationSubscriptionRevoker{subscription};
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  static ReactNotificationSubscriptionRevoker Subscribe(
      IReactNotificationService const &handle,
      winrt::auto_revoke_t,
      ReactNotificationId<TData> const &notificationId,
      THandler &&handler) noexcept {
    return Subscribe(handle, winrt::auto_revoke, notificationId, nullptr, std::forward<THandler>(handler));
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  static ReactNotificationSubscription Subscribe(
      IReactNotificationService const &handle,
      ReactNotificationId<TData> const &notificationId,
      ReactDispatcher const &dispatcher,
      THandler &&handler) noexcept {
    IReactNotificationSubscription subscription = handle
        ? handle.Subscribe(
              notificationId.Handle(),
              dispatcher.Handle(),
              [handler = std::forward<THandler>(handler)](
                  Windows::Foundation::IInspectable const &sender, IReactNotificationArgs const &args) noexcept {
                handler(sender, ReactNotificationArgs<TData>{args});
              })
        : nullptr;
    return ReactNotificationSubscription{subscription};
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  static ReactNotificationSubscription Subscribe(
      IReactNotificationService const &handle,
      ReactNotificationId<TData> const &notificationId,
      THandler &&handler) noexcept {
    return Subscribe(handle, notificationId, nullptr, std::forward<THandler>(handler));
  }

  template <class TData, class TValue>
  static void SendNotification(
      IReactNotificationService const &handle,
      ReactNotificationId<TData> const &notificationId,
      Windows::Foundation::IInspectable const &sender,
      TValue &&value) noexcept {
    if (handle) {
      handle.SendNotification(
          notificationId.Handle(), sender, ReactPropertyBag::ToObject<TData>(std::forward<TValue>(value)));
    }
  }

  static void SendNotification(
      IReactNotificationService const &handle,
      ReactNotificationId<void> const &notificationId,
      Windows::Foundation::IInspectable const &sender) noexcept {
    if (handle) {
      handle.SendNotification(notificationId.Handle(), sender, nullptr);
    }
  }

  template <class TData, class TValue>
  static void SendNotification(
      IReactNotificationService const &handle,
      ReactNotificationId<TData> const &notificationId,
      TValue &&value) noexcept {
    if (handle) {
      handle.SendNotification(
          notificationId.Handle(), nullptr, ReactPropertyBag::ToObject<TData>(std::forward<TValue>(value)));
    }
  }

  static void SendNotification(
      IReactNotificationService const &handle,
      ReactNotificationId<void> const &notificationId) noexcept {
    if (handle) {
      handle.SendNotification(notificationId.Handle(), nullptr, nullptr);
    }
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  ReactNotificationSubscriptionRevoker Subscribe(
      winrt::auto_revoke_t,
      ReactNotificationId<TData> const &notificationId,
      ReactDispatcher const &dispatcher,
      THandler &&handler) const noexcept {
    return Subscribe(m_handle, winrt::auto_revoke, notificationId, dispatcher, std::forward<THandler>(handler));
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  ReactNotificationSubscriptionRevoker
  Subscribe(winrt::auto_revoke_t, ReactNotificationId<TData> const &notificationId, THandler &&handler) const noexcept {
    return Subscribe(m_handle, winrt::auto_revoke, notificationId, nullptr, std::forward<THandler>(handler));
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  ReactNotificationSubscription Subscribe(
      ReactNotificationId<TData> const &notificationId,
      ReactDispatcher const &dispatcher,
      THandler &&handler) const noexcept {
    return Subscribe(m_handle, notificationId, dispatcher, std::forward<THandler>(handler));
  }

  template <class TData, class THandler, std::enable_if_t<IsValidHandlerV<THandler, TData>, int> = 0>
  ReactNotificationSubscription Subscribe(ReactNotificationId<TData> const &notificationId, THandler &&handler) const
      noexcept {
    return Subscribe(m_handle, notificationId, nullptr, std::forward<THandler>(handler));
  }

  template <class TData, class TValue, std::enable_if_t<!std::is_void_v<TData>, int> = 0>
  void SendNotification(
      ReactNotificationId<TData> const &notificationId,
      Windows::Foundation::IInspectable const &sender,
      TValue &&value) const noexcept {
    SendNotification(m_handle, notificationId, sender, std::forward<TValue>(value));
  }

  void SendNotification(
      ReactNotificationId<void> const &notificationId,
      Windows::Foundation::IInspectable const &sender) const noexcept {
    SendNotification(m_handle, notificationId, sender);
  }

  template <class TData, class TValue, std::enable_if_t<!std::is_void_v<TData>, int> = 0>
  void SendNotification(ReactNotificationId<TData> const &notificationId, TValue &&value) const noexcept {
    SendNotification(m_handle, notificationId, std::forward<TValue>(value));
  }

  void SendNotification(ReactNotificationId<void> const &notificationId) const noexcept {
    SendNotification(m_handle, notificationId);
  }

 private:
  IReactNotificationService m_handle;
};

} // namespace winrt::Microsoft::ReactNative

#endif // MICROSOFT_REACTNATIVE_REACTNOTIFICATIONSERVICE
