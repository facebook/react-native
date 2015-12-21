using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Bridge.Queue;
using ReactNative.Hosting.Bridge;
using System;
using System.Threading.Tasks;

namespace ReactNative.Tests.Hosting.Bridge
{
    [TestClass]
    public class ReactBridgeTests
    {
        [TestMethod]
        public async Task ReactBridge_Ctor_ArgumentChecks()
        {
            await JavaScriptHelpers.Run((executor, jsQueueThread) =>
            {
                using (var nativeThread = CreateNativeModulesThread())
                {
                    var reactCallback = new MockReactCallback();

                    AssertEx.Throws<ArgumentNullException>(
                        () => new ReactBridge(null, reactCallback, nativeThread),
                        ex => Assert.AreEqual("jsExecutor", ex.ParamName));

                    AssertEx.Throws<ArgumentNullException>(
                        () => new ReactBridge(executor, null, nativeThread),
                        ex => Assert.AreEqual("reactCallback", ex.ParamName));

                    AssertEx.Throws<ArgumentNullException>(
                        () => new ReactBridge(executor, reactCallback, null),
                        ex => Assert.AreEqual("nativeModulesQueueThread", ex.ParamName));
                }
            });
        }

        [TestMethod]
        public async Task ReactBridge_Method_ArgumentChecks()
        {
            await JavaScriptHelpers.Run((executor, jsQueueThread) =>
            {
                using (var nativeThread = CreateNativeModulesThread())
                {
                    var reactCallback = new MockReactCallback();
                    var bridge = new ReactBridge(executor, reactCallback, nativeThread);

                    AssertEx.Throws<ArgumentNullException>(
                        () => bridge.SetGlobalVariable(null, null),
                        ex => Assert.AreEqual("propertyName", ex.ParamName));
                }
            });
        }

        [TestMethod]
        public async Task ReactBridge_CallFunction()
        {
            await JavaScriptHelpers.Run(async (executor, jsQueueThread) =>
            {
                using (var nativeThread = CreateNativeModulesThread())
                {
                    var reactCallback = new MockReactCallback();
                    var bridge = new ReactBridge(executor, new MockReactCallback(), nativeThread);
                    var token = await jsQueueThread.CallOnQueue(() =>
                    {
                        bridge.CallFunction(1, 1, new JArray());
                        return executor.GetGlobalVariable("BatchProcessCalls");
                    });

                    var expected = new JArray
                    {
                        new JArray
                        {
                            new JObject
                            {
                                { "module", "BatchedBridge" },
                                { "method", "callFunctionReturnFlushedQueue" },
                                { "context", 15 },
                                {
                                    "args",
                                    new JArray
                                    {
                                        1,
                                        1,
                                        new JArray(),
                                    }
                                },
                            }
                        }
                    };

                    Assert.AreEqual(expected.ToString(Formatting.None), token.ToString(Formatting.None));
                }
            });
        }

        [TestMethod]
        public async Task ReactBridge_InvokeCallback()
        {
            await JavaScriptHelpers.Run(async (executor, jsQueueThread) =>
            {
                using (var nativeThread = MessageQueueThread.Create(MessageQueueThreadSpec.Create("native", MessageQueueThreadKind.BackgroundAnyThread), ex => { Assert.Fail(); }))
                {
                    var reactCallback = new MockReactCallback();
                    var bridge = new ReactBridge(executor, new MockReactCallback(), nativeThread);
                    var token = await jsQueueThread.CallOnQueue(() =>
                    {
                        bridge.InvokeCallback(1, new JArray());
                        return executor.GetGlobalVariable("BatchProcessCalls");
                    });

                    var expected = new JArray
                    {
                        new JArray
                        {
                            new JObject
                            {
                                { "module", "BatchedBridge" },
                                { "method", "invokeCallbackAndReturnFlushedQueue" },
                                {
                                    "args",
                                    new JArray
                                    {
                                        1,
                                        new JArray(),
                                    }
                                },
                            }
                        }
                    };

                    Assert.AreEqual(expected.ToString(Formatting.None), token.ToString(Formatting.None));
                }
            });
        }

        private static MessageQueueThread CreateNativeModulesThread()
        {
            return MessageQueueThread.Create(MessageQueueThreadSpec.Create("native", MessageQueueThreadKind.BackgroundAnyThread), ex => { Assert.Fail(); });
        }

        class MockReactCallback : IReactCallback
        {
            private readonly Action<int, int, JArray> _invoke;
            private readonly Action _onBatchComplete;

            public MockReactCallback()
                : this(() => { })
            {
            }

            public MockReactCallback(Action<int, int, JArray> invoke)
                : this(invoke, () => { })
            {
            }

            public MockReactCallback(Action onBatchComplete)
                : this((p0, p1, p2) => { }, onBatchComplete)
            {
            }

            public MockReactCallback(Action<int, int, JArray> invoke, Action onBatchComplete)
            {
                _invoke = invoke;
                _onBatchComplete = onBatchComplete;
            }

            public void Invoke(int moduleId, int methodId, JArray parameters)
            {
                _invoke(moduleId, methodId, parameters);
            }

            public void OnBatchComplete()
            {
                _onBatchComplete();
            }
        }
    }
}
