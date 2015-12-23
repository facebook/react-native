
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.UIManager;
using System.Collections.Generic;
using Windows.UI.Xaml;
using System.Linq;
using System;
using ReactNative.Bridge.Queue;
using System.Threading.Tasks;
using ReactNative.Tracing;
using ReactNative.Hosting.Bridge;

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
        private readonly List<ReactRootView> _attachedRootViews = new List<ReactRootView>();
        private LifecycleState _lifecycleState;
        private readonly string _jsBundleFile;
        private readonly List<IReactPackage> _packages;
        private volatile ReactApplicationContext var;
        private readonly string _jsMainModuleName;
        private readonly UIImplementationProvider _uiImplementationProvider;
        private readonly IDefaultHardwareBackButtonHandler _defaultHardwareBackButtonHandler;

        public ReactInstanceManagerImpl(
            string jsMainModuleName, 
            List<IReactPackage> packages, 
            LifecycleState initialLifecycleState,
            UIImplementationProvider uiImplementationProvider,
            string jsBundleFile)
        {
            _jsBundleFile = jsBundleFile;
            _jsMainModuleName = jsMainModuleName;
            _packages = packages;
            _lifecycleState = initialLifecycleState;
            _uiImplementationProvider = uiImplementationProvider;
            _defaultHardwareBackButtonHandler = new DefaultHardwareBackButtonHandlerImpl(this);
        }

        public override IReadOnlyList<ViewManager<FrameworkElement, ReactShadowNode>> CreateAllViewManagers(ReactApplicationContext catalystApplicationContext)
        {
            var allViewManagers = default(List<ViewManager<FrameworkElement, ReactShadowNode>>);
            foreach (var reactPackage in _packages)
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
            var jsExecutor = new ChakraJavaScriptExecutor();
            var jsBundler = JavaScriptBundleLoader.CreateFileLoader(_jsBundleFile);
            await CreateReactContextAsync(jsExecutor, jsBundler);
        }

        private async Task<ReactContext> CreateReactContextAsync(IJavaScriptExecutor jsExecutor, JavaScriptBundleLoader jsBundleLoader)
        {
            var reactContext = new ReactApplicationContext();
            var nativeRegistryBuilder = new NativeModuleRegistry.Builder();
            var jsModulesBuilder = new JavaScriptModulesConfig.Builder();

            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "createAndProcessCoreModulesPackage"))
            {
                var coreModulesPackage = new CoreModulesPackage(
                    this,
                    _defaultHardwareBackButtonHandler,
                    _uiImplementationProvider);

                ProcessPackage(
                    coreModulesPackage,
                    reactContext,
                    nativeRegistryBuilder,
                    jsModulesBuilder);
            }

            foreach (var reactPackage in _packages)
            {
                using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "createAndProcessCustomReactPackage"))
                {
                    ProcessPackage(
                        reactPackage,
                        reactContext,
                        nativeRegistryBuilder,
                        jsModulesBuilder);
                }
            }

            var nativeModuleRegistry = default(NativeModuleRegistry);
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "buildNativeModuleRegistry"))
            {
                nativeModuleRegistry = nativeRegistryBuilder.Build();
            }

            var javaScriptModulesConfig = default(JavaScriptModulesConfig);
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "buildJSModuleConfig"))
            {
                javaScriptModulesConfig = jsModulesBuilder.Build();
            }

            var javascriptRuntime = new CatalystInstance.Builder
            {
                QueueConfigurationSpec = CatalystQueueConfigurationSpec.Default,
                JavaScriptExecutor = jsExecutor,
                Registry = nativeModuleRegistry,
                JavaScriptModulesConfig = javaScriptModulesConfig,
                BundleLoader = jsBundleLoader,
                NativeModuleCallExceptionHandler = ex => { } /* TODO */,
            }.Build();

            reactContext.InitializeWithInstance(javascriptRuntime);

            await javascriptRuntime.InitializeBridgeAsync();
            
            return var;
        }

        private void ProcessPackage(
            IReactPackage reactPackage,
            ReactApplicationContext reactContext,
            NativeModuleRegistry.Builder nativeRegistryBuilder,
            JavaScriptModulesConfig.Builder jsModulesBuilder)
        {
            foreach (var nativeModule in reactPackage.CreateNativeModules(reactContext))
            {
                nativeRegistryBuilder.Add(nativeModule);
            }

            foreach (var type in reactPackage.CreateJavaScriptModulesConfig())
            {
                jsModulesBuilder.Add(type);
            }
        }

        /// <summary>
        /// Attaches the <see cref="ReactRootView" /> to the list of tracked root views
        /// </summary>
        /// <param name="rootView">The root view for the ReactJS app</param>
        public override void AttachMeasuredRootView(ReactRootView rootView)
        {
            _attachedRootViews.Add(rootView);
            
            if (var != null)
            {
                AttachMeasuredRootViewToInstance(rootView, var.CatalystInstance);
            }
        }

        /// <summary>
        /// Detach given <see cref="rootView" /> from current catalyst instance. 
        /// </summary>
        /// <param name="rootView">The root view for the ReactJS app</param>
        public override void DetachRootView(ReactRootView rootView)
        {
            if (_attachedRootViews.Remove(rootView))
            {
                if (var != null)
                {
                    DetachViewFromInstance(rootView, var.CatalystInstance);
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

        private void InvokeDefaultOnBackPressed()
        {
            DispatcherHelpers.AssertOnDispatcher();
            // TODO: implement
        }

        class DefaultHardwareBackButtonHandlerImpl : IDefaultHardwareBackButtonHandler
        {
            private readonly ReactInstanceManagerImpl _parent;

            public DefaultHardwareBackButtonHandlerImpl(ReactInstanceManagerImpl parent)
            {
                _parent = parent;
            }

            public void InvokeDefaultOnBackPressed()
            {
                _parent.InvokeDefaultOnBackPressed();
            }
        }
    }
}
