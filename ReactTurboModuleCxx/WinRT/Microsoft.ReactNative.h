#pragma once

#include "Windows.Foundation.h"
#include <ReactCommon/CallInvoker.h>

namespace winrt::Microsoft::ReactNative
{

template <typename T>
decltype(auto) ReadOptional(std::optional<T> &opt)
{
  return opt.__get();
}

// IJSValueReader.idl

enum class JSValueType
{
  Null,
  Object,
  Array,
  String,
  Boolean,
  Int64,
  Double,
};

struct IJSValueReader : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual JSValueType ValueType() noexcept = 0;
    virtual bool GetNextObjectProperty(hstring &propertyName) noexcept = 0;
    virtual bool GetNextArrayItem() noexcept = 0;
    virtual hstring GetString() noexcept = 0;
    virtual bool GetBoolean() noexcept = 0;
    virtual int64_t GetInt64() noexcept = 0;
    virtual double GetDouble() noexcept = 0;
  };
  
  JSValueType ValueType() const noexcept { return get_itf()->ValueType(); }
  bool GetNextObjectProperty(hstring &propertyName) const noexcept { return get_itf()->GetNextObjectProperty(propertyName); }
  bool GetNextArrayItem() const noexcept { return get_itf()->GetNextArrayItem(); }
  hstring GetString() const noexcept { return get_itf()->GetString(); }
  bool GetBoolean() const noexcept { return get_itf()->GetBoolean(); }
  int64_t GetInt64() const noexcept { return get_itf()->GetInt64(); }
  double GetDouble() const noexcept { return get_itf()->GetDouble(); }
  
  bool GetNextObjectProperty(const std::wstring_view &propertyName) const noexcept
  {
    auto str = std::wstring(propertyName.cbegin(), propertyName.cend());
    return GetNextObjectProperty(str);
  }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IJSValueReader)
};

// IJSValueWriter.idl

struct IJSValueWriter : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual void WriteNull() noexcept = 0;
    virtual void WriteBoolean(bool value) noexcept = 0;
    virtual void WriteInt64(int64_t value) noexcept = 0;
    virtual void WriteDouble(double value) noexcept = 0;
    virtual void WriteString(const winrt::hstring &value) noexcept = 0;
    virtual void WriteObjectBegin() noexcept = 0;
    virtual void WritePropertyName(const winrt::hstring &name) noexcept = 0;
    virtual void WriteObjectEnd() noexcept = 0;
    virtual void WriteArrayBegin() noexcept = 0;
    virtual void WriteArrayEnd() noexcept = 0;
  };

  void WriteNull() const noexcept { get_itf()->WriteNull(); }
  void WriteBoolean(bool value) const noexcept { get_itf()->WriteBoolean(value); }
  void WriteInt64(int64_t value) const noexcept { get_itf()->WriteInt64(value); }
  void WriteDouble(double value) const noexcept { get_itf()->WriteDouble(value); }
  void WriteString(const winrt::hstring &value) const noexcept { get_itf()->WriteString(value); }
  void WriteObjectBegin() const noexcept { get_itf()->WriteObjectBegin(); }
  void WritePropertyName(const winrt::hstring &name) const noexcept { get_itf()->WritePropertyName(name); }
  void WriteObjectEnd() const noexcept { get_itf()->WriteObjectEnd(); }
  void WriteArrayBegin() const noexcept { get_itf()->WriteArrayBegin(); }
  void WriteArrayEnd() const noexcept { get_itf()->WriteArrayEnd(); }
  
  void WriteString(const wchar_t* value) const noexcept
  {
    auto str = std::wstring(value);
    WriteString(str);
  }
  
  void WriteString(const std::wstring_view &value) const noexcept
  {
    auto str = std::wstring(value.cbegin(), value.cend());
    WriteString(str);
  }
  
  void WritePropertyName(const std::wstring_view &name) const noexcept
  {
    auto str = std::wstring(name.cbegin(), name.cend());
    WritePropertyName(str);
  }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IJSValueWriter)
};

using JSValueArgWriter = std::function<void(const IJSValueWriter&)>;

// IReactPackageBuilder.idl

struct IReactModuleBuilder;

using ReactModuleProvider = std::function<Windows::Foundation::IInspectable(const IReactModuleBuilder&)>;

struct IReactPackageBuilder : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual void AddModule(const hstring& moduleName, const ReactModuleProvider& moduleProvider) noexcept = 0;
  };
  
  void AddModule(const hstring& moduleName, const ReactModuleProvider& moduleProvider) const noexcept { get_itf()->AddModule(moduleName, moduleProvider); }
  
  void AddModule(const wchar_t* moduleName, const ReactModuleProvider& moduleProvider) const noexcept
  {
    AddModule(moduleName, moduleProvider);
  }
  
  void AddModule(const std::wstring_view& moduleName, const ReactModuleProvider& moduleProvider) const noexcept
  {
    auto str = std::wstring(moduleName.cbegin(), moduleName.cend());
    AddModule(str, moduleProvider);
  }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactPackageBuilder)
};

// IReactDispatcher.idl

using ReactDispatcherCallback = std::function<void()>;

struct IReactDispatcher : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual bool HasThreadAccess() const noexcept = 0;
    virtual void Post(const ReactDispatcherCallback& callback) noexcept = 0;
  };
  
  bool HasThreadAccess() const noexcept { return get_itf()->HasThreadAccess(); }
  void Post(const ReactDispatcherCallback& callback) const noexcept { return get_itf()->Post(callback); }

  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactDispatcher)
};

struct ReactDispatcherHelper
{
  static IReactDispatcher CreateSerialDispatcher() noexcept;
};

// IReactNonAbiValue.idl

struct IReactNonAbiValue : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual int64_t GetPtr() const noexcept = 0;
  };
  
  int64_t GetPtr() const noexcept { return get_itf()->GetPtr(); }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactNonAbiValue)
};

// IReactPropertyBag.idl

using ReactCreatePropertyValue = std::function<Windows::Foundation::IInspectable()>;

struct IReactPropertyNamespace : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual hstring NamespaceName() const noexcept = 0;
  };
  
  hstring NamespaceName() const noexcept { return get_itf()->NamespaceName(); }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactPropertyNamespace)
};

struct IReactPropertyName : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual hstring LocalName() const noexcept = 0;
    virtual IReactPropertyNamespace Namespace() const noexcept = 0;
  };
  
  hstring LocalName() const noexcept { return get_itf()->LocalName(); }
  IReactPropertyNamespace Namespace() const noexcept { return get_itf()->Namespace(); }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactPropertyName)
};

struct IReactPropertyBag : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual IInspectable Get(IReactPropertyName name) noexcept = 0;
    virtual IInspectable GetOrCreate(IReactPropertyName name, const ReactCreatePropertyValue& createValue) noexcept = 0;
    virtual IInspectable Set(IReactPropertyName name, IInspectable value) noexcept = 0;
  };

  IInspectable Get(IReactPropertyName name) const noexcept { return get_itf()->Get(name); }
  IInspectable GetOrCreate(IReactPropertyName name, const ReactCreatePropertyValue& createValue) const noexcept { return get_itf()->GetOrCreate(name, createValue); }
  IInspectable Set(IReactPropertyName name, IInspectable value) const noexcept { return get_itf()->Set(name, value); }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactPropertyBag)
};

struct ReactPropertyBagHelper
{
  static IReactPropertyNamespace GlobalNamespace() noexcept;
  static IReactPropertyNamespace GetNamespace(const hstring& namespaceName) noexcept;
  static IReactPropertyName GetName(IReactPropertyNamespace ns, const hstring& localName) noexcept;
  static IReactPropertyBag CreatePropertyBag() noexcept;
};

// IReactNotificationService.idl

struct IReactNotificationSubscription : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual IReactPropertyName NotificationName() const noexcept = 0;
    virtual IReactDispatcher Dispatcher() const noexcept = 0;
    virtual bool IsSubscribed() const noexcept = 0;
    virtual void Unsubscribe() noexcept = 0;
  };

  IReactPropertyName NotificationName() const noexcept { return get_itf()->NotificationName(); }
  IReactDispatcher Dispatcher() const noexcept { return get_itf()->Dispatcher(); }
  bool IsSubscribed() const noexcept { return get_itf()->IsSubscribed(); }
  void Unsubscribe() const noexcept { return get_itf()->Unsubscribe(); }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactNotificationSubscription)
};

struct IReactNotificationArgs : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual IReactNotificationSubscription Subscription() const noexcept = 0;
    virtual IInspectable Data() const noexcept = 0;
  };

  IReactNotificationSubscription Subscription() const noexcept { return get_itf()->Subscription(); }
  IInspectable Data() const noexcept { return get_itf()->Data(); }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactNotificationArgs)
};

using ReactNotificationHandler = std::function<void(Windows::Foundation::IInspectable, IReactNotificationArgs)>;

struct IReactNotificationService : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual IReactNotificationSubscription Subscribe(IReactPropertyName notificationName, IReactDispatcher dispatcher, const ReactNotificationHandler& handler) noexcept = 0;
    virtual void SendNotification(IReactPropertyName notificationName, IInspectable sender, IInspectable data) noexcept = 0;
  };

  IReactNotificationSubscription Subscribe(IReactPropertyName notificationName, IReactDispatcher dispatcher, const ReactNotificationHandler& handler) const noexcept
  {
    return get_itf()->Subscribe(notificationName, dispatcher, handler);
  }
  
  void SendNotification(IReactPropertyName notificationName, IInspectable sender, IInspectable data) const noexcept
  {
    return get_itf()->SendNotification(notificationName, sender, data);
  }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactNotificationService)
};

struct ReactNotificationServiceHelper
{
  static IReactNotificationService CreateNotificationService() noexcept;
};

// IReactContext.idl

struct IReactContext : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual IReactPropertyBag Properties() const noexcept = 0;
    virtual IReactNotificationService Notifications() const noexcept = 0;
    virtual IReactDispatcher UIDispatcher() const noexcept = 0;
    virtual IReactDispatcher JSDispatcher() const noexcept = 0;
    virtual void CallJSFunction(const hstring& moduleName, const hstring& methodName, const JSValueArgWriter& paramsArgWriter) noexcept = 0;
    virtual void EmitJSEvent(const hstring& eventEmitterName, const hstring& eventName, const JSValueArgWriter& paramsArgWriter) noexcept = 0;
  };

  IReactPropertyBag Properties() const noexcept { return get_itf()->Properties(); }
  IReactNotificationService Notifications() const noexcept { return get_itf()->Notifications(); }
  IReactDispatcher UIDispatcher() const noexcept { return get_itf()->UIDispatcher(); }
  IReactDispatcher JSDispatcher() const noexcept { return get_itf()->JSDispatcher(); }
  void CallJSFunction(const hstring& moduleName, const hstring& methodName, const JSValueArgWriter& paramsArgWriter) const noexcept { return get_itf()->CallJSFunction(moduleName, methodName, paramsArgWriter); }
  void EmitJSEvent(const hstring& eventEmitterName, const hstring& eventName, const JSValueArgWriter& paramsArgWriter) const noexcept { return get_itf()->EmitJSEvent(eventEmitterName, eventName, paramsArgWriter); }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactContext)
};

// IReactModuleBuilder.idl

using InitializerDelegate = std::function<void(IReactContext)>;

enum class MethodReturnType
{
  Void,
  Callback,
  TwoCallbacks,
  Promise,
};

using MethodResultCallback = std::function<void(IJSValueWriter)>;

using MethodDelegate = std::function<void(IJSValueReader, IJSValueWriter, MethodResultCallback, MethodResultCallback)>;

using SyncMethodDelegate = std::function<void(IJSValueReader, IJSValueWriter)>;

using ConstantProviderDelegate = std::function<void(IJSValueWriter)>;

struct IReactModuleBuilder : Windows::Foundation::IInspectable
{
  struct Itf : Windows::Foundation::IInspectable::Itf
  {
    virtual void AddInitializer(const InitializerDelegate& initializer) noexcept = 0;
    virtual void AddConstantProvider(const ConstantProviderDelegate& constantProvider) noexcept = 0;
    virtual void AddMethod(const hstring& name, MethodReturnType returnType, const MethodDelegate& method) noexcept = 0;
    virtual void AddSyncMethod(const hstring& name, const SyncMethodDelegate& method) noexcept = 0;
  };

  void AddInitializer(InitializerDelegate initializer) const noexcept { return get_itf()->AddInitializer(initializer); }
  void AddConstantProvider(ConstantProviderDelegate constantProvider) const noexcept { return get_itf()->AddConstantProvider(constantProvider); }
  void AddMethod(const hstring& name, MethodReturnType returnType, MethodDelegate method) const noexcept { return get_itf()->AddMethod(name, returnType, method); }
  void AddSyncMethod(const hstring& name, SyncMethodDelegate method) const noexcept { return get_itf()->AddSyncMethod(name, method); }
  
  void AddMethod(const std::wstring_view& name, MethodReturnType returnType, MethodDelegate method) const noexcept
  {
    auto str = std::wstring(name.cbegin(), name.cend());
    return get_itf()->AddMethod(str, returnType, method);
  }
  
  void AddSyncMethod(const std::wstring_view& name, SyncMethodDelegate method) const noexcept
  {
    auto str = std::wstring(name.cbegin(), name.cend());
    return get_itf()->AddSyncMethod(str, method);
  }
  
  WINRT_TO_MAC_MAKE_WINRT_INTERFACE(IReactModuleBuilder)
};

// MacOS Helper Functions

extern IReactContext CreateMacOSReactContext(const std::shared_ptr<facebook::react::CallInvoker>& jsInvoker) noexcept;
                 
}
