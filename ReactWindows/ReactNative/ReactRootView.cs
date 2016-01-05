using ReactNative.Modules.Core;
using ReactNative.Shell;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative
{
    public class ReactRootView : SizeMonitoringPanel, IRootView
    {
        private IReactInstanceManager _reactInstanceManager;
        private string _jsModuleName;
        private int _rootTageNode;
        private bool _isAttachedToWindow;

        public void OnChildStartedNativeGesture(RoutedEventArgs ev)
        {
            throw new NotImplementedException("Native gesture event handling is not yet supported");
        }

        /// <summary>
        /// Initializes and starts a <see cref="IReactInstanceManager" /> instance.
        /// </summary>
        /// <param name="bundleAssetName">The Javascript Bundle location</param>
        /// <param name="jsModuleName">The core Javascript module name</param>
        public void LiftAsync(string bundleAssetName, string jsModuleName)
        {
            var defaultPackageList = new List<IReactPackage>()
            {
                new MainReactPackage()
            };

            this.LiftAsync(bundleAssetName, jsModuleName, defaultPackageList);
        }

        /// <summary>
        /// Initializes and starts a <see cref="IReactInstanceManager" /> i nstance.
        /// </summary>
        /// <param name="bundleAssetName">The Javascript Bundle location</param>
        /// <param name="jsModuleName">The core Javascript module name</param>
        /// <param name="packages">The list of react packges to initialize</param>
        public void LiftAsync(string bundleAssetName, string jsModuleName, List<IReactPackage> packages)
        {
            var builder = new ReactInstanceManagerImpl.Builder()
            {
                InitialLifecycleState = LifecycleState.RESUMED,
                JSMainModuleName = jsModuleName,
                JSBundleFile = bundleAssetName
            }
            .AddPackages(packages)
            .Build();

            this.StartReactApplication(builder, jsModuleName);
        }

        /// <summary>
        /// Exposes the Javascript module name of the root view
        /// </summary>
        public string JSModuleName
        {
            get
            {
                return _jsModuleName;
            }
        }

        /// <summary>
        /// Exposes the react tag id of the view
        /// </summary>
        public int TagId
        {
            get { return _rootTageNode; }
        }

        /// <summary>
        /// Sets the react tag id to the view
        /// </summary>
        /// <param name="tagId"></param>
        public void BindTagToView(int tagId)
        {
            _rootTageNode = tagId;
        }

        /// <summary>
        /// Schedule rendering of the react component rendered by the JS application from the given JS
        /// module <see cref="moduleName" /> using provided <see cref="ReactInstanceManager" />
        /// </summary>
        /// <param name="reactInstanceManager">The React Instance Manager</param>
        /// <param name="moduleName">module to load</param>
        public async void StartReactApplication(IReactInstanceManager reactInstanceManager, string moduleName)
        {
            _reactInstanceManager = reactInstanceManager;
            _jsModuleName = moduleName;

            await _reactInstanceManager.RecreateReactContextInBackgroundFromBundleFileAsync();

            // We need to wait for the initial onMeasure, if this view has not yet been measured, we set
            // mAttachScheduled flag, which will make this view startReactApplication itself to instance
            // manager once onMeasure is called.
            if (!_isAttachedToWindow)
            {
                _reactInstanceManager.AttachMeasuredRootView(this);
                _isAttachedToWindow = true;
            }
        }

        private void OnDetachedFromWindow(object sender, RoutedEventArgs e)
        {
            _reactInstanceManager.DetachRootView(this);
        }
    }
}
