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
    public class ReactPage : Page
    {
        private readonly IReactInstanceManager _reactInstanceManager;
        private readonly string _mainComponentName;
        private readonly Action _onBackPressed;

        private bool _isShiftKeyDown;
        private bool _isControlKeyDown;

        /// <summary>
        /// Instantiates the <see cref="ReactPage"/>.
        /// </summary>
        /// <param name="jsBundleFile">The JavaScript bundle file.</param>
        /// <param name="mainComponentName">The main component name.</param>
        /// <param name="packages">The list of react packages.</param>
        public ReactPage(
            string jsBundleFile,
            string mainComponentName,
            IReadOnlyList<IReactPackage> packages,
            Action onBackPressed)
        {
            _mainComponentName = mainComponentName;
            _onBackPressed = onBackPressed;
            _reactInstanceManager = CreateReactInstanceManager(jsBundleFile, packages);

            RootView = CreateRootView();
            Content = RootView;
        }

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
            RootView.StartReactApplication(_reactInstanceManager, _mainComponentName);
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
            _reactInstanceManager.OnResume(_onBackPressed);
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

        private IReactInstanceManager CreateReactInstanceManager(string jsBundleFile, IReadOnlyList<IReactPackage> packages)
        {
            var builder = new ReactInstanceManager.Builder
            {
#if DEBUG
                UseDeveloperSupport = true,
#endif
                InitialLifecycleState = LifecycleState.Resumed,
                JavaScriptBundleFile = jsBundleFile,
            };

            foreach (var package in packages)
            {
                builder.Packages.Add(package);
            }

            return builder.Build();
        }
    }
}
