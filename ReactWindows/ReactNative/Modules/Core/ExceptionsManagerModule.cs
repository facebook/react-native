using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;

namespace ReactNative.Modules.Core
{
    public class ExceptionsManagerModule : NativeModuleBase
    {
        public ExceptionsManagerModule()
        {
        }

        public override string Name
        {
            get
            {
                return "ExceptionsManager";
            }
        }

        [ReactMethod]
        public void reportFatalException(string title, JArray details, int exceptionId)
        {
            throw new NotImplementedException();
        }

        [ReactMethod]
        public void reportSoftException(string title, JArray details, int exceptionId)
        {
            throw new NotImplementedException();
        }

        [ReactMethod]
        public void updateExceptionMessage(string title, JArray details, int exceptionId)
        {
            throw new NotImplementedException();
        }
    }
}
