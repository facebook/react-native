using System;
using System.Collections.Generic;
using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System.Linq;
using System.Threading.Tasks;

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

            var catalystInstance = new TestCatalystInstance();
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

            var catalystInstance = new TestCatalystInstance();
            AssertEx.Throws<NativeArgumentsParseException>(
                () => testModule.Methods[nameof(TestNativeModule.Bar)].Invoke(catalystInstance, new JArray()),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_ArgumentConversionException()
        {
            var testModule = new TestNativeModule();

            testModule.Initialize();

            var catalystInstance = new TestCatalystInstance();
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

            var catalystInstance = new TestCatalystInstance();
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

            var catalystInstance = new TestCatalystInstance((i, a) =>
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

            var catalystInstance = new TestCatalystInstance((i, a) =>
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

            var catalystInstance = new TestCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<int>>();
            });

            module.Methods[nameof(CallbackNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42 }));
            Assert.AreEqual(0, args.Count);
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

        class TestCatalystInstance : ICatalystInstance
        {
            private readonly Action<int, JArray> _callback;

            public TestCatalystInstance()
                : this((_, __) => { })
            {
            }

            public TestCatalystInstance(Action<int, JArray> callback)
            {
                _callback = callback;
            }

            public IEnumerable<INativeModule> NativeModules
            {
                get
                {
                    throw new NotImplementedException();
                }
            }

            public T GetNativeModule<T>() where T : INativeModule
            {
                throw new NotImplementedException();
            }

            public Task InitializeAsync()
            {
                return Task.FromResult(true);
            }

            public void InvokeCallback(int callbackId, JArray arguments)
            {
                _callback(callbackId, arguments);
            }
        }
    }
}
