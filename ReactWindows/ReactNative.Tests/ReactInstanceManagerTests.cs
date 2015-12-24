using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge.Queue;
using ReactNative.Shell;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Tests
{
    public class ReactInstanceManagerTests
    {
        public void ReactInstanceManagerInitializationSuccess()
        {
            var jsModuleName = "index.windows";
            var bundleAssetName = "ms-appx:///Resources/index.windows.bundle.js";
            var rootView = new ReactRootView();

            var builder = new ReactInstanceManagerImpl.Builder()
            {
                InitialLifecycleState = LifecycleState.RESUMED,
                JSMainModuleName = jsModuleName,
                JSBundleFile = bundleAssetName
            }
            .AddPackage(new MainReactPackage())
            .Build();

            rootView.StartReactApplication(builder, "InstanceMgrTest");
            Assert.IsTrue(rootView.TagId > 0);
        }
    }
}
