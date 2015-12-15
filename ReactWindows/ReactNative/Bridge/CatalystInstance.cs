using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace ReactNative.Bridge
{
    class CatalystInstance : ICatalystInstance
    {
        public CatalystInstance(NativeModuleRegistry registry)
        {

        }

        public ICollection<INativeModule> NativeModules
        {
            get
            {
                throw new NotImplementedException();
            }
        }

        public T GetNativeModule<T>(Type nativeModuleInterface) where T : INativeModule
        {
            throw new NotImplementedException();
        }

        public void Initialize()
        {
            throw new NotImplementedException();
        }

        public void InvokeCallback(int callbackId, JArray arguments)
        {
            throw new NotImplementedException();
        }
    }
}
