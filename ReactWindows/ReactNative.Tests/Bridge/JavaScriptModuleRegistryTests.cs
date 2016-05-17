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
        public void JavaScriptModuleRegistry_Invoke()
        {
            var registry = new JavaScriptModuleRegistry.Builder()
                .Add<RCTEventEmitter>()
                .Add<AppRegistry>()
                .Add<TestJavaScriptModule>()
                .Build();

            var are = new AutoResetEvent(false);
            var modules = new List<string>();
            var methods = new List<string>();
            var argsList = new List<JArray>();
            var reactInstance = new MockReactInstance((mod, met, args, tracingName) =>
            {
                modules.Add(mod);
                methods.Add(met);
                argsList.Add(args);
                are.Set();
            });

            var module = registry.GetJavaScriptModule<TestJavaScriptModule>(reactInstance);

            module.Foo(42);

            are.WaitOne();

            Assert.AreEqual(1, modules.Count);
            Assert.AreEqual(1, methods.Count);
            Assert.AreEqual(1, modules.Count);

            Assert.AreEqual("TestJavaScriptModule", modules[0]);
            Assert.AreEqual("Foo", methods[0]);
            Assert.AreEqual(
                JArray.FromObject(new[] { 42 }).ToString(Formatting.None),
                argsList[0].ToString(Formatting.None));
        }

        [TestMethod]
        public void JavaScriptModuleRegistry_InvalidModule_Throws()
        {
            var registry = new JavaScriptModuleRegistry.Builder().Build();
            var reactInstance = new MockReactInstance();
            AssertEx.Throws<InvalidOperationException>(() => registry.GetJavaScriptModule<TestJavaScriptModule>(reactInstance));
        }

#if DEBUG
        [TestMethod]
        public void JavaScriptModuleRegistry_Validate()
        {
            var builder = new JavaScriptModuleRegistry.Builder();

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(JavaScriptModuleBase)),
                ex => Assert.AreEqual("type", ex.ParamName));

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(IDerivedJavaScriptModule)),
                ex => Assert.AreEqual("type", ex.ParamName));

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(object)),
                ex => Assert.AreEqual("type", ex.ParamName));

            AssertEx.Throws<ArgumentException>(
                () => builder.Add(typeof(NoConstructorJavaScriptModule)),
                ex => Assert.AreEqual("type", ex.ParamName));
        }
#endif

        public interface IDerivedJavaScriptModule : IJavaScriptModule
        {

        }

        public class NoConstructorJavaScriptModule : JavaScriptModuleBase
        {
            private NoConstructorJavaScriptModule() { }
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
