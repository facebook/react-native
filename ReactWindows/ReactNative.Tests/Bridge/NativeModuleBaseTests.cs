using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class NativeModuleBaseTests
    {
        [TestMethod]
        public void NativeModuleBase_MethodOverload_ThrowsNotSupported()
        {
            AssertEx.Throws<NotSupportedException>(() => new MethodOverloadNativeModule());
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_ArgumentNull()
        {
            var testModule = new TestNativeModule();

            testModule.Initialize();

            var catalystInstance = new MockCatalystInstance();
            AssertEx.Throws<ArgumentNullException>(
                () => testModule.Methods[nameof(TestNativeModule.Foo)].Invoke(null, new JArray()),
                ex => Assert.AreEqual("catalystInstance", ex.ParamName));
            AssertEx.Throws<ArgumentNullException>(
                () => testModule.Methods[nameof(TestNativeModule.Foo)].Invoke(catalystInstance, null),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_ArgumentInvalidCount()
        {
            var testModule = new TestNativeModule();

            testModule.Initialize();

            var catalystInstance = new MockCatalystInstance();
            AssertEx.Throws<NativeArgumentsParseException>(
                () => testModule.Methods[nameof(TestNativeModule.Bar)].Invoke(catalystInstance, new JArray()),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_ArgumentConversionException()
        {
            var testModule = new TestNativeModule();

            testModule.Initialize();

            var catalystInstance = new MockCatalystInstance();
            AssertEx.Throws<NativeArgumentsParseException>(
                () => testModule.Methods[nameof(TestNativeModule.Bar)].Invoke(catalystInstance, JArray.FromObject(new[] { default(object) })),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation()
        {
            var fooCount = 0;
            var barSum = 0;
            var testModule = new TestNativeModule(() => fooCount++, x => barSum += x);

            testModule.Initialize();

            Assert.AreEqual(2, testModule.Methods.Count);

            var catalystInstance = new MockCatalystInstance();
            testModule.Methods[nameof(TestNativeModule.Foo)].Invoke(catalystInstance, new JArray());
            testModule.Methods[nameof(TestNativeModule.Foo)].Invoke(catalystInstance, new JArray());
            Assert.AreEqual(2, fooCount);

            testModule.Methods[nameof(TestNativeModule.Bar)].Invoke(catalystInstance, JArray.FromObject(new[] { 42 }));
            testModule.Methods[nameof(TestNativeModule.Bar)].Invoke(catalystInstance, JArray.FromObject(new[] { 17 }));
            Assert.AreEqual(59, barSum);
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_Callbacks()
        {
            var callbackArgs = new object[] { 1, 2, 3 };
            var module = new CallbackNativeModule(callbackArgs);
            module.Initialize();

            var id = default(int);
            var args = default(List<int>);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<int>>();
            });

            module.Methods[nameof(CallbackNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42 }));
            Assert.AreEqual(42, id);
            Assert.IsTrue(args.Cast<object>().SequenceEqual(callbackArgs));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_Callbacks_InvalidArgumentThrows()
        {
            var callbackArgs = new object[] { 1, 2, 3 };
            var module = new CallbackNativeModule(callbackArgs);
            module.Initialize();

            var id = default(int);
            var args = default(List<int>);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<int>>();
            });

            AssertEx.Throws<NativeArgumentsParseException>(
                () => module.Methods[nameof(CallbackNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { default(object) })),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_Callbacks_NullCallback()
        {
            var module = new CallbackNativeModule(null);
            module.Initialize();

            var id = default(int);
            var args = default(List<int>);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<int>>();
            });

            module.Methods[nameof(CallbackNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42 }));
            Assert.AreEqual(0, args.Count);
        }

        [TestMethod]
        public void NativeModuleBase_CompiledDelegateFactory_Perf()
        {
            var module = new PerfNativeModule(CompiledReactDelegateFactory.Instance);
            var catalystInstance = new MockCatalystInstance();
            var args = JArray.FromObject(new[] { 42 });

            module.Initialize();

            var n = 100000;
            for (var i = 0; i < n; ++i)
            {
                module.Methods[nameof(PerfNativeModule.Foo)].Invoke(catalystInstance, args);
            }
        }

        [TestMethod]
        public void NativeModuleBase_ReflectionDelegateFactory_Perf()
        {
            var module = new PerfNativeModule(ReflectionReactDelegateFactory.Instance);
            var catalystInstance = new MockCatalystInstance();
            var args = JArray.FromObject(new[] { 42 });

            module.Initialize();

            var n = 100000;
            for (var i = 0; i < n; ++i)
            {
                module.Methods[nameof(PerfNativeModule.Foo)].Invoke(catalystInstance, args);
            }
        }

        class MethodOverloadNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public void Foo()
            {
            }

            [ReactMethod]
            public void Foo(int x)
            {
            }
        }

        class TestNativeModule : NativeModuleBase
        {
            private readonly Action _onFoo;
            private readonly Action<int> _onBar;

            public TestNativeModule()
                : this(() => { }, _ => { })
            {
            }

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

        class CallbackNativeModule : NativeModuleBase
        {
            private readonly object[] _callbackArgs;

            public CallbackNativeModule()
                : this(null)
            {
            }

            public CallbackNativeModule(object[] callbackArgs)
            {
                _callbackArgs = callbackArgs;
            }

            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public void Foo(ICallback callback)
            {
                callback.Invoke(_callbackArgs);
            }
        }

        class PerfNativeModule : NativeModuleBase
        {
            public PerfNativeModule(IReactDelegateFactory delegateFactory)
                : base(delegateFactory)
            {
            }

            public override string Name
            {
                get
                {
                    return "Perf";
                }
            }

            [ReactMethod]
            public void Foo(int x) { }
        }
    }
}
