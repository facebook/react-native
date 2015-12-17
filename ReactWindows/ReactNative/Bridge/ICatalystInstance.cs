using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ReactNative.Bridge
{
    public interface ICatalystInstance
    {
        IEnumerable<INativeModule> NativeModules { get; }

        void InvokeCallback(int callbackId, JArray arguments);

        Task InitializeAsync();

        T GetNativeModule<T>(Type nativeModuleInterface) where T : INativeModule;
    }
}
