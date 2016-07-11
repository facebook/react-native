using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.UIManager;
using System.Collections.Generic;

namespace ReactNative.Tests.UIManager
{
    [TestClass]
    public class AppRegistryTests
    {
        [TestMethod]
        public void AppRegistry_InvokeTests()
        {
            var module = new AppRegistry();

            var name = default(string);
            var args = default(object[]);
            module.InvocationHandler = new MockInvocationHandler((n, a) =>
            {
                name = n;
                args = a;
            });

            var appKey = "foo";
            var appParameters = new Dictionary<string, object>();
            module.runApplication(appKey, appParameters);
            Assert.AreEqual(nameof(AppRegistry.runApplication), name);
            Assert.AreEqual(2, args.Length);
            Assert.AreSame(appKey, args[0]);
            Assert.AreSame(appParameters, args[1]);

            module.unmountApplicationComponentAtRootTag(42);
            Assert.AreEqual(nameof(AppRegistry.unmountApplicationComponentAtRootTag), name);
            Assert.AreEqual(1, args.Length);
            Assert.AreEqual(42, args[0]);
        }
    }
}
