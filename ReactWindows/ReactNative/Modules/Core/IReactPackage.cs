
namespace ReactNative.Modules.Core
{
    using Bridge;
    using UIManager;
    using System.Collections.Generic;
    using Windows.UI.Xaml;

    public interface IReactPackage
    {
        /// <summary>
        /// Builds all the native modules for a react package. 
        /// </summary>
        /// <param name="reactContext">The React app context</param>
        /// <returns>The module registry</returns>
        NativeModuleRegistry createNativeModules(ReactApplicationContext reactContext);
    
        /// <summary>
        /// Creates all the javascript modules
        /// </summary>
        /// <returns>the registered javascript modules</returns>
        JavaScriptModulesConfig createJSModules();

        List<ViewManager<FrameworkElement, ReactShadowNode>> CreateViewManagers(ReactApplicationContext reactContext);
    }
}
