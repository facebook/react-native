using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class ViewManagerRegistryTests
    {
        [TestMethod]
        public void ViewManagerRegistry_ArgumentChecks()
        {
            AssertEx.Throws<ArgumentNullException>(
                () => new ViewManagerRegistry(null),
                ex => Assert.AreEqual("viewManagers", ex.ParamName));

            var registry = new ViewManagerRegistry(new List<ViewManager>());

            AssertEx.Throws<ArgumentNullException>(
                () => registry.Get(null),
                ex => Assert.AreEqual("className", ex.ParamName));

            AssertEx.Throws<ArgumentException>(
                () => registry.Get("foo"),
                ex => Assert.AreEqual("className", ex.ParamName));
        }

        [TestMethod]
        public void ViewManagerRegistry_Simple()
        {
            var viewManager = new TestViewManager();
            var registry = new ViewManagerRegistry(new List<ViewManager> { viewManager });
            Assert.AreSame(viewManager, registry.Get(viewManager.Name));
        }

        class TestViewManager : ViewManager
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            public override Type ShadowNodeType
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public override ReactShadowNode CreateShadowNodeInstance()
            {
                throw new NotImplementedException();
            }

            public override void UpdateExtraData(FrameworkElement root, object extraData)
            {
                throw new NotImplementedException();
            }

            protected override FrameworkElement CreateViewInstance(ThemedReactContext reactContext)
            {
                throw new NotImplementedException();
            }
        }
    }
}
