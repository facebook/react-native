using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;
using System;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class ReactContextNativeModuleBaseTests
    {
        [TestMethod]
        public void ReactContextNativeModuleBase_ArgumentChecks()
        {
            AssertEx.Throws<ArgumentNullException>(
                () => new TestModule(null),
                ex => Assert.AreEqual("reactContext", ex.ParamName));

            var context = new ReactApplicationContext();
            var module = new TestModule(context);
            Assert.AreSame(context, module.Context);
        }

        class TestModule : ReactContextNativeModuleBase
        {
            public TestModule(ReactApplicationContext reactContext)
                : base(reactContext)
            {
            }

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
