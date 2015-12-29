using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.UIManager;
using ReactNative.Views;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Threading.Tasks;
using Windows.UI.Xaml;

namespace ReactNative
{
    /// <summary>
    /// This interface manages instances of <see cref="CatalystInstance" />. It expose a way to configure
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
    /// 2.Add background mode 
    /// </summary>
    public interface IReactInstanceManager : IDisposable
    {
        IReadOnlyList<ViewManager<FrameworkElement, ReactShadowNode>> CreateAllViewManagers(ReactApplicationContext catalystApplicationContext);

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

        void Dispose();

        /// <summary>
        /// Attach given {@param rootView} to a catalyst instance manager and start JS application
        /// </summary>
        /// <param name="rootView">The root view of the ReactJS app</param>
        void AttachMeasuredRootView(ReactRootView rootView);

        /// <summary>
        /// Detach given rootView from current catalyst instance.
        /// </summary>
        /// <param name="rootView">The root view of the ReactJS app</param>
        void DetachRootView(ReactRootView rootView);

        /// <summary>
        /// Loads the <see cref="ReactApplicationContext" /> based on the user configured bundle <see cref="ReactApplicationContext#_jsBundleFile" /
        /// </summary>
        Task<ReactContext> RecreateReactContextInBackgroundFromBundleFileAsync();
        
    }
}
