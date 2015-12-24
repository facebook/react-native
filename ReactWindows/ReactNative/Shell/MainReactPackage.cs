using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.Shell
{
    /// <summary>
    /// Package defining basic modules and view managers.
    /// </summary>
    public class MainReactPackage : IReactPackage
    {
        public IReadOnlyList<INativeModule> CreateNativeModules(ReactApplicationContext reactContext)
        {
            return new List<INativeModule>();
        }

        public IReadOnlyList<Type> CreateJavaScriptModulesConfig()
        {
            return new List<Type>();
        }

        public IReadOnlyList<ViewManager<FrameworkElement, ReactShadowNode>> CreateViewManagers(
            ReactApplicationContext reactContext)
        {
            return new List<ViewManager<FrameworkElement, ReactShadowNode>>();
        }
    }
}