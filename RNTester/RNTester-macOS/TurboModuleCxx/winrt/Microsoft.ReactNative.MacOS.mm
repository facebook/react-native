#include "Microsoft.ReactNative.h"
#include <dispatch/dispatch.h>

namespace winrt::Microsoft::ReactNative
{

struct MacOSUIDispatcher : implements<MacOSUIDispatcher, IReactDispatcher>
{
  bool HasThreadAccess() const noexcept
  {
    VerifyElseCrash(false);
  }
  void Post(const ReactDispatcherCallback& callback) noexcept
  {
    auto copy = callback;
    dispatch_async(dispatch_get_main_queue(), ^{
      copy();
    });
  }
};

struct MacOSJSDispatcher : implements<MacOSUIDispatcher, IReactDispatcher>
{
  std::shared_ptr<facebook::react::CallInvoker> _jsInvoker;
  
  MacOSJSDispatcher(const std::shared_ptr<facebook::react::CallInvoker>& jsInvoker)
    : _jsInvoker(jsInvoker)
  {
  }
  
  bool HasThreadAccess() const noexcept
  {
    VerifyElseCrash(false);
  }
  
  void Post(const ReactDispatcherCallback& callback) noexcept
  {
    _jsInvoker->invokeAsync(ReactDispatcherCallback(callback));
  }
};

struct MacOSReactContext : implements<MacOSReactContext, IReactContext>
{
  IReactDispatcher _uiDispatcher;
  IReactDispatcher _jsDispatcher;
  
  MacOSReactContext(const std::shared_ptr<facebook::react::CallInvoker>& jsInvoker)
  {
    _uiDispatcher = make<MacOSUIDispatcher>();
    _jsDispatcher = make<MacOSJSDispatcher>(jsInvoker);
  }
  
  IReactPropertyBag Properties() const noexcept
  {
    VerifyElseCrash(false);
  }
  
  IReactNotificationService Notifications() const noexcept
  {
    VerifyElseCrash(false);
  }
  
  IReactDispatcher UIDispatcher() const noexcept
  {
    return _uiDispatcher;
  }
  
  IReactDispatcher JSDispatcher() const noexcept
  {
    return _jsDispatcher;
  }
  
  void CallJSFunction(const hstring& moduleName, const hstring& methodName, const JSValueArgWriter& paramsArgWriter) noexcept
  {
    VerifyElseCrash(false);
  }
  
  void EmitJSEvent(const hstring& eventEmitterName, const hstring& eventName, const JSValueArgWriter& paramsArgWriter) noexcept
  {
    VerifyElseCrash(false);
  }
};

IReactContext CreateMacOSReactContext(const std::shared_ptr<facebook::react::CallInvoker>& jsInvoker) noexcept
{
  return make<MacOSReactContext>(jsInvoker);
}
                 
}
