using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.IO;
using System.Linq;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class NativeModuleRegistryTests
    {
        [TestMethod]
        public void NativeModuleRegistry_ArgumentChecks()
        {
            var builder = new NativeModuleRegistry.Builder();
            AssertEx.Throws<ArgumentNullException>(
                () => builder.Add(null),
                ex => Assert.AreEqual("module", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleRegistry_Override_Disallowed()
        {
            var builder = new NativeModuleRegistry.Builder();
            builder.Add(new OverrideDisallowedModule());
            AssertEx.Throws<InvalidOperationException>(() => builder.Add(new OverrideDisallowedModule()));
        }

        [TestMethod]
        public void NativeModuleRegistry_Override_Allowed()
        {
            var registry = new NativeModuleRegistry.Builder()
                .Add(new OverrideAllowedModule())
                .Add(new OverrideAllowedModule())
                .Build();

            Assert.AreEqual(1, registry.Modules.Count());
        }

        [TestMethod]
        public void NativeModuleRegistry_ModuleWithNullName_Throws()
        {
            var builder = new NativeModuleRegistry.Builder();
            AssertEx.Throws<ArgumentException>(
                () => builder.Add(new NullNameModule()),
                ex => Assert.AreEqual("module", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleRegistry_WriteModuleDefinitions()
        {
            var registry = new NativeModuleRegistry.Builder()
                .Add(new TestNativeModule())
                .Build();

            using (var stringWriter = new StringWriter())
            {
                using (var writer = new JsonTextWriter(stringWriter))
                {
                    registry.WriteModuleDescriptions(writer);
                }

                var actual = JObject.Parse(stringWriter.ToString());
                Assert.AreEqual(1, actual.Properties().Count());

                var moduleDef = actual.GetValue("Test") as JObject;
                Assert.IsNotNull(moduleDef);

                var moduleId = moduleDef.GetValue("moduleID");
                Assert.IsNotNull(moduleId);
                Assert.AreEqual("0", moduleId.ToString());

                var methods = moduleDef.GetValue("methods") as JObject;
                Assert.IsNotNull(methods);

                var fooMethod = methods.GetValue("Foo") as JObject;
                Assert.IsNotNull(fooMethod);

                var barMethod = methods.GetValue("Bar") as JObject;
                Assert.IsNotNull(barMethod);

                var fooMethodId = fooMethod.GetValue("methodID");
                var barMethodId = barMethod.GetValue("methodID");
                Assert.AreNotEqual(fooMethodId.ToString(), barMethodId.ToString());
                Assert.IsTrue(fooMethodId.ToString() == "0" || fooMethodId.ToString() == "1");
                Assert.IsTrue(barMethodId.ToString() == "0" || barMethodId.ToString() == "1");
            }
        }

        class OverrideDisallowedModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Foo";
                }
            }
        }

        class OverrideAllowedModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Foo";
                }
            }

            public override bool CanOverrideExistingModule
            {
                get
                {
                    return true;
                }
            }
        }

        class NullNameModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return null;
                }
            }
        }

        class TestNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public void Foo(int x) { }

            [ReactMethod]
            public void Bar(string x) { }
        }
    }
}
