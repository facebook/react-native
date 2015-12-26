using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge.Queue;
using ReactNative.Shell;
using ReactNative.Views;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
namespace ReactNative.Tests
{
    [TestClass]
    public class ReactInstanceManagerTests
    {
        [TestMethod]
        public void ReactInstanceManagerInitializationSuccess()
        {
            var jsModuleName = "index.windows";
            var bundleAssetName = "ms-appx:///Resources/index.windows.bundle.js";
            var rootView = new ReactRootView();
                rootView.Lift(bundleAssetName, jsModuleName);
            Assert.IsTrue(rootView.TagId > 0);
        }
    }
}
