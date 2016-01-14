using ReactNative.Modules.Core;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

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
            RootView.HorizontalAlignment = HorizontalAlignment.Stretch;
            RootView.VerticalAlignment = VerticalAlignment.Stretch;

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

        private IReactInstanceManager CreateReactInstanceManager(string jsBundleFile, IReadOnlyList<IReactPackage> packages)
        {
            var builder = new ReactInstanceManager.Builder
            {
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
