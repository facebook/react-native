
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.UIManager;
using System.Collections.Generic;
using Windows.UI.Xaml;
using System.Linq;
using System;
using ReactNative.Bridge.Queue;
using System.Threading.Tasks;

namespace ReactNative
{
    /// <summary>
    /// This class is managing instances of <see cref="CatalystInstance" />. It expose a way to configure
    /// catalyst instance using <see cref="IReactPackage" /> and keeps track of the lifecycle of that
    /// instance. It also sets up connection between the instance and developers support functionality
    /// of the framework.
    ///
    /// An instance of this manager is required to start JS application in <see cref="ReactRootView" /> (see
    /// <see cref="ReactRootView#startReactApplication" /> for more info).
    ///
    /// TODO:
    /// 1.Implement background task functionality and ReactContextInitAsyncTask class hierarchy.
    /// 2.Lifecycle managment functoinality. i.e. resume, pause, etc
    /// 3.Implement Backbutton handler
    /// 4.Implement js bundler load progress checks to ensure thread safety
    /// 5.Implement the ViewGroupManager as well as the main ReactViewManager
    /// 6.Create DevManager functionality to manage things like exceptions.
    /// </summary>
    public class ReactInstanceManagerImpl : ReactInstanceManager
    {
        private readonly List<ReactRootView> _AttachedRootViews = new List<ReactRootView>();
        private LifecycleState _LifecycleState;
        private readonly string _jsBundleFile;
        private readonly List<IReactPackage> _reactPackages;
        private volatile ReactApplicationContext _CurrentReactContext;
        private readonly string _jsMainModuleName;
        private readonly UIImplementationProvider _UIImplementationProvider;

        public ReactInstanceManagerImpl(string jsMainModuleName, List<IReactPackage> packages, LifecycleState initialLifecycleState,
                                        UIImplementationProvider uiImplementationProvider, string jsBundleFile)
        {
            _jsBundleFile = jsBundleFile;
            _jsMainModuleName = jsMainModuleName;
            _reactPackages = packages;
            _LifecycleState = initialLifecycleState;
            _UIImplementationProvider = uiImplementationProvider;
        }

        public override List<ViewManager<FrameworkElement, ReactShadowNode>> CreateAllViewManagers(ReactApplicationContext catalystApplicationContext)
        {
            var allViewManagers = default(List<ViewManager<FrameworkElement, ReactShadowNode>>);
            foreach (var reactPackage in _reactPackages)
            {
                var viewManagers = reactPackage.CreateViewManagers(catalystApplicationContext);
                allViewManagers.Concat(viewManagers);
            }

            return allViewManagers;
        }

        /// <summary>
        /// Loads the <see cref="ReactApplicationContext" /> based on the user configured bundle <see cref="ReactApplicationContext#_jsBundleFile" />
        /// </summary>
        public override async void RecreateReactContextInBackgroundFromBundleFileAsync()
        {
            var jsExecutor = default(IJavaScriptExecutor);
            var jsBundler = await JavaScriptBundleLoader.Builder.Build(new Uri[] { new Uri(_jsBundleFile) });
            //TODO: Instantiate chakraJSExecutor following Erics rebase.
            await CreateReactContextAsync(jsExecutor, jsBundler);
        }

        private async Task<ReactContext> CreateReactContextAsync(IJavaScriptExecutor jsExecutor, JavaScriptBundleLoader jsBundleLoader)
        {
            _CurrentReactContext = new ReactApplicationContext();
            var coreModulesPackage = new CoreModulesPackage(this, _UIImplementationProvider);
            var queueConfig = CatalystQueueConfigurationSpec.Default;

            var javascriptRuntime = new CatalystInstance.Builder
            {
                QueueConfigurationSpec = queueConfig,
                JavaScriptExecutor = jsExecutor,
                Registry = coreModulesPackage.createNativeModules(_CurrentReactContext),
                JavaScriptModulesConfig = coreModulesPackage.createJSModules(),
                BundleLoader = jsBundleLoader,
                NativeModuleCallExceptionHandler = ex => { } /* TODO */,
            }.Build();

            _CurrentReactContext.InitializeWithInstance(javascriptRuntime);
            await javascriptRuntime.RunJSBundleAsync();
            
            return _CurrentReactContext;
        }

        /// <summary>
        /// Attaches the <see cref="ReactRootView" /> to the list of tracked root views
        /// </summary>
        /// <param name="rootView">The root view for the ReactJS app</param>
        public override void AttachMeasuredRootView(ReactRootView rootView)
        {
            _AttachedRootViews.Add(rootView);
            
            if (_CurrentReactContext != null)
            {
                AttachMeasuredRootViewToInstance(rootView, _CurrentReactContext.CatalystInstance);
            }
        }

        /// <summary>
        /// Detach given <see cref="rootView" /> from current catalyst instance. 
        /// </summary>
        /// <param name="rootView">The root view for the ReactJS app</param>
        public override void DetachRootView(ReactRootView rootView)
        {
            if (_AttachedRootViews.Remove(rootView))
            {
                if (_CurrentReactContext != null)
                {
                    DetachViewFromInstance(rootView, _CurrentReactContext.CatalystInstance);
                }
            }
        }

        private void DetachViewFromInstance(ReactRootView rootView, ICatalystInstance catalystInstance)
        {
            try
            {
                catalystInstance.GetJavaScriptModule<AppRegistry>()?.unmountApplicationComponentAtRootTag(rootView.TagId);
            }
            catch (InvalidOperationException ex)
            {
                throw new InvalidOperationException("Unable to load AppRegistry JS module. Error message: " + ex.Message);
            }
        }

        private void AttachMeasuredRootViewToInstance(ReactRootView rootView, ICatalystInstance catalystInstance)
        {
            UIManagerModule uiManagerModule = catalystInstance.GetNativeModule<UIManagerModule>();
            int rootTag = uiManagerModule.AddMeasuredRootView(rootView);
            var initialProps = new Dictionary<string, object>();
                initialProps.Add("rootTag", rootTag);

            try
            {
                catalystInstance.GetJavaScriptModule<AppRegistry>()?.runApplication(rootView.JSModuleName, initialProps);
            }
            catch (InvalidOperationException ex)
            {
                throw new InvalidOperationException("Unable to load AppRegistry JS module. Error message: " + ex.Message);
            }
        }
    }
}
