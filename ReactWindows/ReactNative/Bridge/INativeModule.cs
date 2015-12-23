using System.Collections.Generic;

namespace ReactNative.Bridge
{
    /// <summary>
    /// A native module whose API can be provided to JavaScript catalyst
    /// instances. 
    /// </summary>
    /// <remarks>
    /// <see cref="INativeModule"/>s whose implementation is written in C#
    /// should extend <see cref="NativeModuleBase"/> or
    /// <see cref="ReactContextNativeModuleBase"/>.
    /// </remarks>
    public interface INativeModule
    {
        /// <summary>
        /// Return true if you intend to override some other native module that
        /// was registered, e.g., as part of a different package (such as the
        /// core one). Trying to override without returning true from this 
        /// method is considered an error and will throw an exception during
        /// initialization. By default, all modules return false.
        /// </summary>
        bool CanOverrideExistingModule { get; }

        /// <summary>
        /// The constants exported by this module.
        /// </summary>
        IReadOnlyDictionary<string, object> Constants { get; }

        /// <summary>
        /// The methods callabke from JavaScript on this module.
        /// </summary>
        IReadOnlyDictionary<string, INativeMethod> Methods { get; }

        /// <summary>
        /// The name of the module.
        /// </summary>
        /// <remarks>
        /// This will be the name used to <code>require()</code> this module
        /// from JavaScript.
        /// </remarks>
        string Name { get; }

        /// <summary>
        /// Called after the creation of a <see cref="ICatalystInstance"/>, in
        /// order to initialize native modules that require the catalyst or
        /// JavaScript modules.
        /// </summary>
        void Initialize();

        /// <summary>
        /// Called before a <see cref="ICatalystInstance"/> is disposed.
        /// </summary>
        void OnCatalystInstanceDispose();
    }
}
