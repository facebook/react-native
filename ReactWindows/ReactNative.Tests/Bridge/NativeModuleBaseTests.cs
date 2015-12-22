using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ReactNative.Tests.Bridge
{
    [TestClass]
    public class NativeModuleBaseTests
    {
        [TestMethod]
        public void NativeModuleBase_ReactMethod_ThrowsNotSupported()
        {
            var actions = new Action[]
            {
                () => new MethodOverloadNotSupportedNativeModule(),
                () => new ReturnTypeNotSupportedNativeModule(),
                () => new CallbackNotSupportedNativeModule(),
                () => new CallbackNotSupportedNativeModule2(),
                () => new PromiseNotSupportedNativeModule(),
                () => new AsyncCallbackNotSupportedNativeModule(),
                () => new AsyncPromiseNotSupportedNativeModule(),
            };

            foreach (var action in actions)
            {
                AssertEx.Throws<NotSupportedException>(action);
            }
        }

        [TestMethod]
        public void NativeModuleBase_ReactMethod_Async_ThrowsNotImplemented()
        {
            AssertEx.Throws<NotImplementedException>(() => new AsyncNotImplementedNativeModule());
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
        public void NativeModuleBase_Invocation_Promises_Resolve()
        {
            var module = new PromiseNativeModule(() => 17);
            module.Initialize();

            var id = default(int);
            var args = default(List<int>);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<int>>();
            });

            module.Methods[nameof(PromiseNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42, 43 }));
            Assert.AreEqual(42, id);
            Assert.IsTrue(args.SequenceEqual(new[] { 17 }));
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
        public void NativeModuleBase_Invocation_Promises_InvalidArgumentThrows()
        {
            var module = new PromiseNativeModule(() => 17);
            module.Initialize();

            var id = default(int);
            var args = default(List<int>);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<int>>();
            });

            AssertEx.Throws<NativeArgumentsParseException>(
                () => module.Methods[nameof(PromiseNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { default(object), 43 })),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));

            AssertEx.Throws<NativeArgumentsParseException>(
                () => module.Methods[nameof(PromiseNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42, default(object) })),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_Promises_IncorrectArgumentCount()
        {
            var module = new PromiseNativeModule(() => null);
            module.Initialize();

            var id = default(int);
            var args = default(List<object>);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<object>>();
            });

            AssertEx.Throws<NativeArgumentsParseException>(
                () => module.Methods[nameof(PromiseNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42 })),
                ex => Assert.AreEqual("jsArguments", ex.ParamName));
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_Promises_Reject()
        {
            var expectedMessage = "Foo bar baz";
            var exception = new Exception(expectedMessage);
            var module = new PromiseNativeModule(() => { throw exception; });
            module.Initialize();

            var id = default(int);
            var args = default(Dictionary<string, string>[]);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<Dictionary<string, string>[]>();
            });

            module.Methods[nameof(CallbackNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42, 43 }));
            Assert.AreEqual(43, id);
            Assert.AreEqual(1, args.Length);
            var d = args[0];
            Assert.AreEqual(1, d.Count);
            var actualMessage = default(string);
            Assert.IsTrue(d.TryGetValue("message", out actualMessage));
            Assert.AreEqual(expectedMessage, actualMessage);
        }

        [TestMethod]
        public void NativeModuleBase_Invocation_Promises_NullCallback()
        {
            var module = new PromiseNativeModule(() => null);
            module.Initialize();

            var id = default(int);
            var args = default(List<object>);

            var catalystInstance = new MockCatalystInstance((i, a) =>
            {
                id = i;
                args = a.ToObject<List<object>>();
            });

            module.Methods[nameof(PromiseNativeModule.Foo)].Invoke(catalystInstance, JArray.FromObject(new[] { 42, 43 }));
            Assert.AreEqual(1, args.Count);
            Assert.IsNull(args[0]);
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

        class MethodOverloadNotSupportedNativeModule : NativeModuleBase
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

        class ReturnTypeNotSupportedNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public int Foo() { return 0; }
        }
        
        class CallbackNotSupportedNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public void Foo(ICallback foo, int bar, string qux) { }
        }

        class CallbackNotSupportedNativeModule2 : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public void Foo(ICallback bar, int foo) { }
        }

        class PromiseNotSupportedNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public void Foo(IPromise promise, int foo) { }
        }

        class AsyncCallbackNotSupportedNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public Task Foo(ICallback callback)
            {
                return Task.FromResult(true);
            }
        }

        class AsyncPromiseNotSupportedNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public Task Foo(IPromise promise)
            {
                return Task.FromResult(true);
            }
        }

        class AsyncNotImplementedNativeModule : NativeModuleBase
        {
            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public Task Foo()
            {
                return Task.FromResult(true);
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

        class PromiseNativeModule : NativeModuleBase
        {
            private readonly Func<object> _resolveFactory;

            public PromiseNativeModule()
                : this(() => null)
            {
            }

            public PromiseNativeModule(Func<object> resolveFactory)
            {
                _resolveFactory = resolveFactory;
            }

            public override string Name
            {
                get
                {
                    return "Test";
                }
            }

            [ReactMethod]
            public void Foo(IPromise promise)
            {
                try
                {
                    promise.Resolve(_resolveFactory());
                }
                catch (Exception ex)
                {
                    promise.Reject(ex);
                }
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
