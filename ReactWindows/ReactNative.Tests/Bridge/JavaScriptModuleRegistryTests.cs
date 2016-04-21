using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
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
            var reactInstance = new MockReactInstance();
            var config = new JavaScriptModulesConfig.Builder().Build();

            AssertEx.Throws<ArgumentNullException>(
                () => new JavaScriptModuleRegistry(null, config),
                ex => Assert.AreEqual("reactInstance", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => new JavaScriptModuleRegistry(reactInstance, null),
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
            var reactInstance = new MockReactInstance((moduleId, methodId, args, tracingName) =>
            {
                moduleIds.Add(moduleId);
                methodIds.Add(methodId);
                argsList.Add(args);
                are.Set();
            });

            var registry = new JavaScriptModuleRegistry(reactInstance, config);
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
            var reactInstance = new MockReactInstance();
            var registry = new JavaScriptModuleRegistry(reactInstance, config);
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
