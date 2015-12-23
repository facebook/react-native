using ReactNative.Bridge;
using System.Collections.Generic;
using System;
using Windows.UI.Xaml;
using ReactNative.UIManager;
using ReactNative.Modules.Core;

namespace ReactNative
{
    /// <summary>
    /// This class is managing instances of <see cref="CatalystInstance" />. It expose a way to configure
    /// catalyst instance using <see cref="ReactRootView"/> and keeps track of the lifecycle of that
    /// instance.It also sets up connection between the instance and developers support functionality
    /// of the framework.
    ///
    /// An instance of this manager is required to start JS application in <see cref=" ReactRootView"/>
    /// #startReactApplication for more info).
    ///
    /// The lifecycle of the instance of <see cref="ReactInstanceManager"/> should be bound to the activity
    /// that owns the <see cref="ReactRootView"/> that is used to render react application using this
    /// instance manager <see cref=" ReactRootView"/>. It's required to pass
    /// owning activity's lifecycle events to the instance manager #onPause, #onDestroy, #onResume
    /// TODO:
    /// 1.Add lifecycle event hooks
    /// </summary>
    public abstract class ReactInstanceManager
    {
       public abstract List<ViewManager<FrameworkElement, ReactShadowNode>> CreateAllViewManagers(ReactApplicationContext catalystApplicationContext);
        /// <summary>
        /// Trigger react context initialization asynchronously in a background async task.
        /// </summary>
        //public abstract void createReactContextInBackground();

        /// <summary>
        /// return whether createReactContextInBackground has been called
        /// </summary>
        /// <returns></returns>
        //public abstract bool hasStartedCreatingInitialContext();

        //public abstract void onBackPressed();
        //public abstract void onPause();

        //public abstract void onResume(DefaultHardwareBackBtnHandler defaultBackButtonImpl);

        //public abstract void onDestroy();

        /// <summary>
        /// Attach given {@param rootView} to a catalyst instance manager and start JS application
        /// </summary>
        /// <param name="rootView">The root view of the ReactJS app</param>
        public abstract void AttachMeasuredRootView(ReactRootView rootView);

        /// <summary>
        /// Detach given rootView from current catalyst instance.
        /// </summary>
        /// <param name="rootView">The root view of the ReactJS app</param>
        public abstract void DetachRootView(ReactRootView rootView);

        /// <summary>
        /// Loads the <see cref="ReactApplicationContext" /> based on the user configured bundle <see cref="ReactApplicationContext#_jsBundleFile" /
        /// </summary>
        public abstract void RecreateReactContextInBackgroundFromBundleFileAsync();

        class Builder
        {
            protected readonly List<IReactPackage> _reactPackages = new List<IReactPackage>();
            private LifecycleState _LifecycleState;
            private UIImplementationProvider _UIImplementationProvider;
            private string _jsBundleFile;
            private string _jsMainModuleName;

            /// <summary>
            /// Sets a provider of <see cref="UIImplementation" />.
            /// </summary>
            /// <param name="uiImplementationProvider">The UI Implementaiton provider</param>
            /// <returns></returns>
            public Builder SetUIImplementationProvider(UIImplementationProvider uiImplementationProvider)
            {
                _UIImplementationProvider = uiImplementationProvider;
                return this;
            }

            /// <summary>
            /// Path to the JS bundle file to be loaded from the file system.
            /// </summary>
            /// <param name="jsBundleFile">JS bundle file path</param>
            /// <returns>A builder instance</returns>
            public Builder SetJSBundleFile(string jsBundleFile)
            {
                _jsBundleFile = jsBundleFile;
                return this;
            }
            
            /// <summary>
            /// Path to your app's main module on the packager server. This is used when
            /// reloading JS during development. All paths are relative to the root folder
            /// the packager is serving files from.
            /// </summary>
            /// <param name="jsMainModuleName"></param>
            /// <returns></returns>
            public Builder SetJSMainModuleName(string jsMainModuleName)
            {
                _jsMainModuleName = jsMainModuleName;
                return this;
            }

            public Builder AddPackage(IReactPackage reactPackage)
            {
                _reactPackages.Add(reactPackage);
                return this;
            }

            /// <summary>
            /// Instantiates a new {@link ReactInstanceManagerImpl}.
            /// </summary>
            /// <param name="initialLifecycleState"></param>
            /// <returns></returns>
            public Builder SetInitialLifecycleState(LifecycleState initialLifecycleState)
            {
                _LifecycleState = initialLifecycleState;
                return this;
            }

            /// <summary>
            /// Instantiates a new <see cref="ReactInstanceManagerImpl"/> .
            /// Before calling <see mref="build"/>, the following must be called: setApplication then setJSMainModuleName
            /// </summary>
            /// <returns>A ReactInstanceManager instance</returns>
            public ReactInstanceManager Build()
            {
                if (_jsBundleFile == null || _jsMainModuleName == null)
                {
                    throw new ArgumentNullException("JS bundle information is not provided exception");
                }

                if (_UIImplementationProvider == null)
                {
                    // create default UIImplementationProvider if the provided one is null.
                    _UIImplementationProvider = new UIImplementationProvider();
                }

                return new ReactInstanceManagerImpl(_jsMainModuleName, _reactPackages,
                                                    _LifecycleState, _UIImplementationProvider, _jsBundleFile);
            }
        }
    }
}
