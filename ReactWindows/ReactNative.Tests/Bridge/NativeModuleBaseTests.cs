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
            var fooCount = 0;
            var barSum = 0;
            var testModule = new TestNativeModule(() => fooCount++, x => barSum += x);

            testModule.Initialize();

            Assert.AreEqual(2, testModule.Methods.Count);
            foreach (var key in testModule.Methods.Keys)
            {
                // TODO
            }
        }

        class TestNativeModule : NativeModuleBase
        {
            private readonly Action _onFoo;
            private readonly Action<int> _onBar;

            public TestNativeModule(Action onFoo, Action<int> onBar)
            {
                _onFoo = onFoo;
                _onBar = onBar;
            }

            public override string Name
            {
                get
                {
                    return "Foo";
                }
            }

            [ReactMethod]
            public void Foo()
            {
                _onFoo();
            }

            [ReactMethod]
            public void Bar(int x)
            {
                _onBar(x);
            }
        }
    }
}
