using System;
using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class NativeModuleBaseTests
    {
        [TestMethod]
        public void NativeModuleBase_ArgumentChecks()
        {

        }

        class TestNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Foo";
                }
            }
        }
    }
}
