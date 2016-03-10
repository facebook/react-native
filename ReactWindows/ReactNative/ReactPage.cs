using ReactNative.Modules.Core;
using System;
using System.Collections.Generic;
using Windows.System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;

namespace ReactNative
{
    /// <summary>
    /// Base page for React Native applications.
    /// </summary>
    public abstract class ReactPage : Page
    {
        private readonly IReactInstanceManager _reactInstanceManager;

        private bool _isShiftKeyDown;
        private bool _isControlKeyDown;

        /// <summary>
        /// Instantiates the <see cref="ReactPage"/>.
        /// </summary>
        protected ReactPage()
        {
            _reactInstanceManager = CreateReactInstanceManager();
            RootView = CreateRootView();
            Content = RootView;
        }

        /// <summary>
        /// The custom path of the bundle file.
        /// </summary>
        /// <remarks>
        /// This is used in cases where the bundle should be loaded from a
        /// custom path.
        /// </remarks>
        public virtual string JavaScriptBundleFile
        {
            get
            {
                return null;
            }
        }

        /// <summary>
        /// The name of the main module.
        /// </summary>
        /// <remarks>
        /// This is used to determine the URL used to fetch the JavaScript
        /// bundle from the packager server. It is only used when dev support
        /// is enabled.
        /// </remarks>
        public virtual string JavaScriptMainModuleName
        {
            get
            {
                return "index.windows";
            }
        }

        /// <summary>
        /// The name of the main component registered from JavaScript.
        /// </summary>
        public abstract string MainComponentName { get; }

        /// <summary>
        /// Signals whether developer mode should be enabled.
        /// </summary>
        public abstract bool UseDeveloperSupport { get; }

        /// <summary>
        /// The list of <see cref="IReactPackage"/>s used by the application.
        /// </summary>
        public abstract List<IReactPackage> Packages { get; }

        /// <summary>
        /// The root view managed by the page.
        /// </summary>
        public ReactRootView RootView
        {
            get;
        }

        /// <summary>
        /// Called when the application is first initialized.
        /// </summary>
        public void OnCreate()
        {
            RootView.Background = (Brush)Application.Current.Resources["ApplicationPageBackgroundThemeBrush"];
            RootView.StartReactApplication(_reactInstanceManager, MainComponentName);
        }

        /// <summary>
        /// Called before the application is suspended.
        /// </summary>
        public void OnSuspend()
        {
            _reactInstanceManager.OnSuspend();
        }

        /// <summary>
        /// Called when the application is resumed.
        /// </summary>
        public void OnResume()
        {
            _reactInstanceManager.OnResume(OnBackPressed);
        }

        /// <summary>
        /// Called before the application shuts down.
        /// </summary>
        public void OnDestroy()
        {
            _reactInstanceManager.OnDestroy();
        }

        /// <summary>
        /// Creates the React root view.
        /// </summary>
        /// <returns>The root view.</returns>
        /// <remarks>
        /// Subclasses may override this method if it needs to use a custom
        /// root view.
        /// </remarks>
        protected virtual ReactRootView CreateRootView()
        {
            return new ReactRootView();
        }
        
        /// <summary>
        /// Action to take when the back button is pressed.
        /// </summary>
        protected virtual void OnBackPressed()
        {
        }

        /// <summary>
        /// Captures the key down events to 
        /// </summary>
        /// <param name="e"></param>
        protected override void OnKeyDown(KeyRoutedEventArgs e)
        {
            if (_reactInstanceManager.DevSupportManager.IsEnabled)
            {
                if (e.Key == VirtualKey.Shift)
                {
                    _isShiftKeyDown = true;
                }
                else if (e.Key == VirtualKey.Control)
                {
                    _isControlKeyDown = true;   
                }
                else if (_isShiftKeyDown && e.Key == VirtualKey.F10)
                {
                    _reactInstanceManager.DevSupportManager.ShowDevOptionsDialog();
                    e.Handled = true;
                }
                else if (_isControlKeyDown && e.Key == VirtualKey.R)
                {
                    _reactInstanceManager.DevSupportManager.HandleReloadJavaScript();
                    e.Handled = true;
                }
            }
        }

        /// <summary>
        /// Captures the key up event to potentially launch the dev options menu.
        /// </summary>
        /// <param name="e"></param>
        protected override void OnKeyUp(KeyRoutedEventArgs e)
        {
            if (_reactInstanceManager.DevSupportManager.IsEnabled)
            {
                if (e.Key == VirtualKey.Menu)
                {
                    _reactInstanceManager.DevSupportManager.ShowDevOptionsDialog();
                    e.Handled = true;
                }
                else if (e.Key == VirtualKey.Shift)
                {
                    _isShiftKeyDown = false;
                }
                else if (e.Key == VirtualKey.Control)
                {
                    _isControlKeyDown = false;
                }
            }
        }

        private IReactInstanceManager CreateReactInstanceManager()
        {
            var builder = new ReactInstanceManager.Builder
            {
                UseDeveloperSupport = UseDeveloperSupport,
                InitialLifecycleState = LifecycleState.Resumed,
                JavaScriptBundleFile = JavaScriptBundleFile,
                JavaScriptMainModuleName = JavaScriptMainModuleName,
            };

            builder.Packages.AddRange(Packages);
            return builder.Build();
        }
    }
}
