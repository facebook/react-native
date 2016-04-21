using ReactNative.Bridge;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// Main interface for providing additional capabilities to the react 
    /// framework through the following mechanisms:
    /// 
    /// 1) Registering new native modules.
    /// 2) Registering new JavaScript modules that may be accessed from native
    ///    modules or from other parts of the native code (requiring JavaScript
    ///    modules from the package doesn't mean it will automatically be 
    ///    included as a part of the JavaScript bundle, so there should be a 
    ///    corresponding piece of code on JavaScript side that will require the
    ///    implementation of that JavaScript module so that it gets bundled).
    /// 3) Registering custom native views (i.e., view managers) and custom 
    ///    event types.
    /// 4) Registering natively packaged assets/resources (e.g. images) exposed
    ///    to JavaScript.
    /// </summary>
    public interface IReactPackage
    {
        /// <summary>
        /// Creates the list of native modules to register with the react
        /// instance. 
        /// </summary>
        /// <param name="reactContext">The react application context.</param>
        /// <returns>The list of native modules.</returns>
        IReadOnlyList<INativeModule> CreateNativeModules(ReactContext reactContext);

        /// <summary>
        /// Creates the list of JavaScript modules to register with the 
        /// react instance. 
        /// </summary>
        /// <returns>The list of JavaScript modules.</returns>
        /// <remarks>
        /// C# lacks the ability to restrict which types this method is called
        /// with at compile time, so adding types that either do not have a 
        /// default constructor or do not derive from 
        /// <see cref="IJavaScriptModule"/> will result in a runtime exception.
        /// </remarks>
        IReadOnlyList<Type> CreateJavaScriptModulesConfig();

        /// <summary>
        /// Creates the list of view managers that should be registered with
        /// the <see cref="UIManagerModule"/>.
        /// </summary>
        /// <param name="reactContext">The react application context.</param>
        /// <returns>The list of view managers.</returns>
        IReadOnlyList<IViewManager> CreateViewManagers(ReactContext reactContext);
    }
}
