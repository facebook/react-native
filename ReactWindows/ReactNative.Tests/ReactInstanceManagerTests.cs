using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Views;
using System.Threading.Tasks;

namespace ReactNative.Tests
{
    [TestClass]
    public class ReactInstanceManagerTests
    {
        
        //TODO: Looking into XAML custom control issue. This test is currently being ignored for the meantime until the issue has been resolved.
        public async Task ReactInstanceManagerInitializationSuccess()
        {
            var jsModuleName = "index.windows";
            var bundleAssetName = "ms-appx:///Resources/main.jsbundle";
            var rootView = await DispatcherHelpers.CallOnDispatcherAsync(() => new ReactRootView());
            await DispatcherHelpers.CallOnDispatcherAsync(() => rootView.Lift(bundleAssetName, jsModuleName));
            Assert.AreEqual(rootView.TagId, 0); 
        }
    }
}
