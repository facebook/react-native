using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace ReactNative.Bridge
{
    public interface ICatalystInstance
    {
        ICollection<INativeModule> NativeModules { get; }

        void InvokeCallback(int callbackId, JArray arguments);

        void Initialize();

        T GetNativeModule<T>(Type nativeModuleInterface) where T : INativeModule;
    }
}
