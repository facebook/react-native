using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using System;
using System.Collections.Generic;

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
            var builder = new NativeModuleRegistry.Builder();
            builder.Add(new OverrideAllowedModule());
            builder.Add(new OverrideAllowedModule());
        }

        [TestMethod]
        public void NativeModuleRegistry_ModuleWithNullName_Throws()
        {
            var builder = new NativeModuleRegistry.Builder();
            AssertEx.Throws<ArgumentException>(
                () => builder.Add(new NullNameModule()),
                ex => Assert.AreEqual("module", ex.ParamName));
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
    }
}
