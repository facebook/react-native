using ReactNative.Bridge;

namespace ReactNative.Modules.Storage
{

    public class AsyncStorageModule : NativeModuleBase
    {
        public override string Name
        {
            get
            {
                return "AsyncLocalStorage";
            }
        }
    }
}
