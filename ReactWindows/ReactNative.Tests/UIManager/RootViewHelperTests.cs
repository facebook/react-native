using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.UIManager;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class RootViewHelperTests
    {
        [TestMethod]
        public void RootViewHelper_Null()
        {
            Assert.IsNull(RootViewHelper.GetRootView(null));
        }

        class TestRootView : Panel, IRootView
        {
            public void OnChildStartedNativeGesture(RoutedEventArgs ev)
            {
            }
        }
    }
}
