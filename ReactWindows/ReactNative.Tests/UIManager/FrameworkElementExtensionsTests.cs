using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using ReactNative.UIManager;
using System;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class FrameworkElementExtensionsTests
    {
        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void FrameworkElementExtensions_ArgumentChecks()
        {
            var element = new Button();

            AssertEx.Throws<ArgumentNullException>(
                () => FrameworkElementExtensions.SetTag(null, 0),
                ex => Assert.AreEqual("view", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => FrameworkElementExtensions.SetReactContext(null, null),
                ex => Assert.AreEqual("view", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => FrameworkElementExtensions.GetTag(null),
                ex => Assert.AreEqual("view", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => FrameworkElementExtensions.GetReactContext(null),
                ex => Assert.AreEqual("view", ex.ParamName));
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void FrameworkElementExtensions_ExistingTag()
        {
            var button = new Button();
            button.Tag = new object();

            AssertEx.Throws<InvalidOperationException>(() => button.SetTag(1));
            AssertEx.Throws<InvalidOperationException>(() => button.SetReactContext(null));
        }

        [Microsoft.VisualStudio.TestPlatform.UnitTestFramework.AppContainer.UITestMethod]
        public void FrameworkElementExtensions_Get_Set()
        {
            var button = new Button();

            button.SetTag(42);
            Assert.AreEqual(42, button.GetTag());

            button.SetReactContext(null);
            Assert.IsNull(button.GetReactContext());
        }

    }
}
