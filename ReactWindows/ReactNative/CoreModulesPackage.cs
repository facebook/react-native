using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.Tracing;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative
{
    /// <summary>
    /// Package defining core framework modules (e.g., <see cref="UIManagerModule"/>). 
    /// It should be used for modules that require special integration with
    /// other framework parts (e.g., with the list of packages to load view
    /// managers from).
    /// 
    /// TODO:
    /// 1. Add Core native modules
    /// 2. Implement UIManagerModule
    /// 3. Add remaining JavaScript modules
    /// </summary>
    class CoreModulesPackage : IReactPackage
    {
        private readonly IReactInstanceManager _reactInstanceManager;
        private readonly IDefaultHardwareBackButtonHandler _hardwareBackButtonHandler;
        private readonly UIImplementationProvider _uiImplementationProvider;

        public CoreModulesPackage(
            IReactInstanceManager reactInstanceManager,
            IDefaultHardwareBackButtonHandler hardwareBackButtonHandler,
            UIImplementationProvider uiImplementationProvider)
        {
            _reactInstanceManager = reactInstanceManager;
            _hardwareBackButtonHandler = hardwareBackButtonHandler;
            _uiImplementationProvider = uiImplementationProvider;
        }

        public IReadOnlyList<INativeModule> CreateNativeModules(ReactApplicationContext reactContext)
        {
            var uiManagerModule = default(INativeModule);
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "createUIManagerModule"))
            {
                var viewManagerList = _reactInstanceManager.CreateAllViewManagers(reactContext);
                uiManagerModule = new UIManagerModule(
                    reactContext, 
                    viewManagerList,
                    _uiImplementationProvider.CreateUIImplementation(
                        reactContext, 
                        viewManagerList));
            }

            return new List<INativeModule>
            {
                uiManagerModule,
            };
        }

        public IReadOnlyList<Type> CreateJavaScriptModulesConfig()
        {
            return new List<Type>
            {
                typeof(RCTDeviceEventEmitter),
                typeof(RCTEventEmitter),
                typeof(RCTNativeAppEventEmitter),
                typeof(AppRegistry),
            };
        }

        public IReadOnlyList<ViewManager<FrameworkElement, ReactShadowNode>> CreateViewManagers(
            ReactApplicationContext reactContext)
        {
            return new List<ViewManager<FrameworkElement, ReactShadowNode>>();
        }
    }
}
