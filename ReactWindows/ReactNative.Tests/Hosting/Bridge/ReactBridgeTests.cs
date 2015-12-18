using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Bridge.Queue;
using ReactNative.Hosting.Bridge;
using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Storage;

namespace ReactNative.Tests.Hosting.Bridge
{
    [TestClass]
    public class ReactBridgeTests
    {
        [TestMethod]
        public async Task ReactBridge_Ctor_ArgumentChecks()
        {
            using (var jsThread = CreateJavaScriptThread())
            using (var nativeThread = CreateNativeModulesThread())
            {
                var executor = await CreateTestExecutor(jsThread);
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

                await DisposeTestExecutor(executor, jsThread);
            }
        }

        [TestMethod]
        public async Task ReactBridge_Method_ArgumentChecks()
        {
            using (var jsThread = CreateJavaScriptThread())
            using (var nativeThread = CreateNativeModulesThread())
            {
                var executor = await CreateTestExecutor(jsThread);
                var reactCallback = new MockReactCallback();
                var bridge = new ReactBridge(executor, reactCallback, nativeThread);

                AssertEx.Throws<ArgumentNullException>(
                    () => bridge.SetGlobalVariable(null, null),
                    ex => Assert.AreEqual("propertyName", ex.ParamName));

                await DisposeTestExecutor(executor, jsThread);
            }
        }

        [TestMethod]
        public async Task ReactBridge_CallFunction()
        {
            using (var jsThread = CreateJavaScriptThread())
            using (var nativeThread = CreateNativeModulesThread())
            {
                var executor = await CreateTestExecutor(jsThread);
                var reactCallback = new MockReactCallback();
                var bridge = new ReactBridge(executor, new MockReactCallback(), nativeThread);
                var token = await jsThread.CallOnQueue(() =>
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

                await DisposeTestExecutor(executor, jsThread);
            }
        }

        [TestMethod]
        public async Task ReactBridge_InvokeCallback()
        {
            using (var jsThread = MessageQueueThread.Create(MessageQueueThreadSpec.Create("js", MessageQueueThreadKind.BackgroundSingleThread), ex => { Assert.Fail(); }))
            using (var nativeThread = MessageQueueThread.Create(MessageQueueThreadSpec.Create("native", MessageQueueThreadKind.BackgroundAnyThread), ex => { Assert.Fail(); }))
            {
                var executor = await CreateTestExecutor(jsThread);
                var reactCallback = new MockReactCallback();
                var bridge = new ReactBridge(executor, new MockReactCallback(), nativeThread);
                var token = await jsThread.CallOnQueue(() =>
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

                await DisposeTestExecutor(executor, jsThread);
            }
        }

        private static MessageQueueThread CreateNativeModulesThread()
        {
            return MessageQueueThread.Create(MessageQueueThreadSpec.Create("native", MessageQueueThreadKind.BackgroundAnyThread), ex => { Assert.Fail(); });
        }

        private static MessageQueueThread CreateJavaScriptThread()
        {
            return MessageQueueThread.Create(MessageQueueThreadSpec.Create("js", MessageQueueThreadKind.BackgroundAnyThread), ex => { Assert.Fail(); });
        }

        private static async Task<ChakraJavaScriptExecutor> CreateTestExecutor(IMessageQueueThread jsQueueThread)
        {
            var scriptUris = new[]
            {
                new Uri(@"ms-appx:///Resources/test.js"),
            };

            var scripts = new string[scriptUris.Length];

            for (var i = 0; i < scriptUris.Length; ++i)
            {
                var uri = scriptUris[i];
                var storageFile = await StorageFile.GetFileFromApplicationUriAsync(uri);
                using (var stream = await storageFile.OpenStreamForReadAsync())
                using (var reader = new StreamReader(stream))
                {
                    scripts[i] = reader.ReadToEnd();
                }
            }

            return await jsQueueThread.CallOnQueue(() =>
            {
                var executor = new ChakraJavaScriptExecutor();
                foreach (var script in scripts)
                {
                    executor.RunScript(script);
                }

                return executor;
            });
        }

        private static Task DisposeTestExecutor(IJavaScriptExecutor executor, IMessageQueueThread jsQueueThread)
        {
            return jsQueueThread.CallOnQueue(() =>
            {
                executor.Dispose();
                return default(object);
            });
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
