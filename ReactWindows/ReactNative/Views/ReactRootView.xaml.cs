using ReactNative.Modules.Core;
using ReactNative.Shell;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.InteropServices.WindowsRuntime;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Foundation.Collections;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Controls.Primitives;
using Windows.UI.Xaml.Data;
using Windows.UI.Xaml.Input;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Navigation;

// The Blank Page item template is documented at http://go.microsoft.com/fwlink/?LinkId=234238

namespace ReactNative.Views
{
    /// <summary>
    /// Default root view for catalyst apps. Provides the ability to listen
    /// for size changes so that a UI manager can re-layout its elements
    /// TODO:
    /// 1. Add support for events(i.e. define the sendEvents method)
    /// 2. Add lifecycle functions to ensure the bundle is only loaded once
    /// </summary>
    public sealed partial class ReactRootView : UserControl, IRootView
    {
        private IReactInstanceManager _ReactInstanceManager;
        private string _JSModuleName;
        private int _rootTageNode;
        private bool _IsAttachedToWindow;

        public ReactRootView()
        {
            this.InitializeComponent();
            this.SizeChanged += ReactRootView_SizeChanged;
            this.Unloaded += onDetachedFromWindow;
        }

        private void onDetachedFromWindow(object sender, RoutedEventArgs e)
        {
            _ReactInstanceManager.DetachRootView(this);
        }

        private void ReactRootView_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            throw new NotImplementedException();
        }

        public void OnChildStartedNativeGesture(RoutedEventArgs ev)
        {
            throw new NotImplementedException("Native gesture event handling is not yet supported");
        }

        /// <summary>
        /// Initializes and starts a <see cref="IReactInstanceManager" /> instance.
        /// </summary>
        /// <param name="bundleAssetName">The Javascript Bundle location</param>
        /// <param name="jsModuleName">The core Javascript module name</param>
        public async Task Lift(string bundleAssetName, string jsModuleName)
        {
            var defaultPackageList = new List<IReactPackage>()
            {
                new MainReactPackage()
            };

            await this.Lift(bundleAssetName, jsModuleName, defaultPackageList);
        }

        /// <summary>
        /// Initializes and starts a <see cref="IReactInstanceManager" /> i nstance.
        /// </summary>
        /// <param name="bundleAssetName">The Javascript Bundle location</param>
        /// <param name="jsModuleName">The core Javascript module name</param>
        /// <param name="packages">The list of react packges to initialize</param>
        public async Task Lift(string bundleAssetName, string jsModuleName, List<IReactPackage> packages)
        {
            var builder = new ReactInstanceManagerImpl.Builder()
            {
                InitialLifecycleState = LifecycleState.RESUMED,
                JSMainModuleName = jsModuleName,
                JSBundleFile = bundleAssetName
            }
            .AddPackages(packages)
            .Build();

            await this.StartReactApplication(builder, jsModuleName);
        }

        /// <summary>
        /// Exposes the Javascript module name of the root view
        /// </summary>
        public string JSModuleName
        {
            get
            {
                return _JSModuleName;
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
        public async Task StartReactApplication(IReactInstanceManager reactInstanceManager, string moduleName)
        {
            _ReactInstanceManager = reactInstanceManager;
            _JSModuleName = moduleName;

            await _ReactInstanceManager.RecreateReactContextInBackgroundFromBundleFileAsync();

            // We need to wait for the initial onMeasure, if this view has not yet been measured, we set
            // mAttachScheduled flag, which will make this view startReactApplication itself to instance
            // manager once onMeasure is called.
            if (!_IsAttachedToWindow)
            {
                _ReactInstanceManager.AttachMeasuredRootView(this);
                _IsAttachedToWindow = true;
            }
        }
    }
}
