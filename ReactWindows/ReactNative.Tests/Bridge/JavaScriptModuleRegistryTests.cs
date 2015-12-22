using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.UIManager;
using System;
using System.Collections.Generic;
using System.Threading;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class JavaScriptModuleRegistryTests
    {
        [TestMethod]
        public void JavaScriptModuleRegistry_ArgumentChecks()
        {
            var catalystInstance = new MockCatalystInstance();
            var config = new JavaScriptModulesConfig.Builder().Build();

            AssertEx.Throws<ArgumentNullException>(
                () => new JavaScriptModuleRegistry(null, config),
                ex => Assert.AreEqual("catalystInstance", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => new JavaScriptModuleRegistry(catalystInstance, null),
                ex => Assert.AreEqual("config", ex.ParamName));
        }

        [TestMethod]
        public void JavaScriptModuleRegistry_Invoke()
        {
            var config = new JavaScriptModulesConfig.Builder()
                .Add<RCTEventEmitter>()
                .Add<AppRegistry>()
                .Add<TestJavaScriptModule>()
                .Build();

            var are = new AutoResetEvent(false);
            var moduleIds = new List<int>();
            var methodIds = new List<int>();
            var argsList = new List<JArray>();
            var catalystInstance = new MockCatalystInstance((moduleId, methodId, args, tracingName) =>
            {
                moduleIds.Add(moduleId);
                methodIds.Add(methodId);
                argsList.Add(args);
                are.Set();
            });

            var registry = new JavaScriptModuleRegistry(catalystInstance, config);
            var module = registry.GetJavaScriptModule<TestJavaScriptModule>();

            module.Foo(42);

            are.WaitOne();

            Assert.AreEqual(1, moduleIds.Count);
            Assert.AreEqual(1, methodIds.Count);
            Assert.AreEqual(1, moduleIds.Count);

            Assert.AreEqual(2, moduleIds[0]);
            Assert.AreEqual(2, methodIds[0]);
            Assert.AreEqual(
                JArray.FromObject(new[] { 42 }).ToString(Formatting.None), 
                argsList[0].ToString(Formatting.None));
        }

        [TestMethod]
        public void JavaScriptModuleRegistry_InvalidModule_Throws()
        {
            var config = new JavaScriptModulesConfig.Builder().Build();
            var catalystInstance = new MockCatalystInstance();
            var registry = new JavaScriptModuleRegistry(catalystInstance, config);
            AssertEx.Throws<InvalidOperationException>(() => registry.GetJavaScriptModule<TestJavaScriptModule>());
        }

        class TestJavaScriptModule : JavaScriptModuleBase
        {
            public void Bar()
            {
                Invoke();
            }

            public void Baz()
            {
                Invoke();
            }

            public void Foo(int x)
            {
                Invoke(x);
            }
        }
    }
}
