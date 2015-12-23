
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.UIManager;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative
{
    /// <summary>
    /// Package defining core framework modules (e.g. UIManager). It should be used for modules that
    /// require special integration with other framework parts (e.g. with the list of packages to load
    /// view managers from).
    /// 
    /// TODO
    /// 1.add DefaultHardwareBackBtnHandler functoinality
    /// 2.Add Core native modules
    /// 3.Implement UIManagerModule
    /// </summary>
    public class CoreModulesPackage : IReactPackage
    {
        private readonly ReactInstanceManager _ReactInstanceManager;
        private readonly UIImplementationProvider _UIImplementationProvider;

        public CoreModulesPackage(ReactInstanceManager reactInstanceManager, UIImplementationProvider uiImplementationProvider)
        {
            _ReactInstanceManager = reactInstanceManager;
            _UIImplementationProvider = uiImplementationProvider;
        }

        public NativeModuleRegistry createNativeModules(ReactApplicationContext reactContext)
        {
            var uiManagerModule = default(UIManagerModule);
            List<ViewManager<FrameworkElement, ReactShadowNode>> viewManagersList = _ReactInstanceManager.CreateAllViewManagers(reactContext);

            uiManagerModule = new UIManagerModule(reactContext, viewManagersList, _UIImplementationProvider.createUIImplementation(reactContext, viewManagersList));

            var builder = new NativeModuleRegistry.Builder();

            return builder.Build();
        }

        public JavaScriptModulesConfig createJSModules()
        {
            var builder = new JavaScriptModulesConfig.Builder();
                builder.Add<RCTEventEmitter>();
                builder.Add<RCTNativeAppEventEmitter>();
                builder.Add<AppRegistry>();

            return builder.Build();
        }

        public List<ViewManager<FrameworkElement, ReactShadowNode>> CreateViewManagers(ReactApplicationContext reactContext)
        {
            return new List<ViewManager<FrameworkElement, ReactShadowNode>>(0);
        }
    }
}
