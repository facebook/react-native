#include "Microsoft.ReactNative.h"

namespace winrt::Microsoft::ReactNative
{

// ReactDispatcherHelper

IReactDispatcher ReactDispatcherHelper::CreateSerialDispatcher() noexcept
{
  VerifyElseCrash(false);
}

// ReactPropertyBagHelper

IReactPropertyNamespace ReactPropertyBagHelper::GlobalNamespace() noexcept
{
  VerifyElseCrash(false);
}

IReactPropertyNamespace ReactPropertyBagHelper::GetNamespace(const hstring& namespaceName) noexcept
{
  VerifyElseCrash(false);
}

IReactPropertyName ReactPropertyBagHelper::GetName(IReactPropertyNamespace ns, const hstring& localName) noexcept
{
  VerifyElseCrash(false);
}

IReactPropertyBag ReactPropertyBagHelper::CreatePropertyBag() noexcept
{
  VerifyElseCrash(false);
}

// ReactNotificationServiceHelper

IReactNotificationService ReactNotificationServiceHelper::CreateNotificationService() noexcept
{
  VerifyElseCrash(false);
}
                 
}
