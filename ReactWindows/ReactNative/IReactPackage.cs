using System.Collections.Generic;

namespace ReactNative.Bridge
{
    interface IReactPackage
    {
        IList<INativeModule> CreateNativeModules(ReactApplicationContext context);

        IList<IViewManager> CreateViewManagers(ReactApplicationContext context);
    }
}
