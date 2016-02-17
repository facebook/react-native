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

            var registry = new ViewManagerRegistry(new List<IViewManager>());

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
            var registry = new ViewManagerRegistry(new List<IViewManager> { viewManager });
            Assert.AreSame(viewManager, registry.Get(viewManager.Name));
        }

        class TestViewManager : MockViewManager
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }
        }
    }
}
