using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
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
    public class ChakraJavaScriptExecutorTests
    {
        [TestMethod]
        public async Task ChakraJavaScriptExecutor_ArgumentChecks()
        {
            using (var jsThread = CreateJavaScriptThread())
            {
                var executor = await CreateTestExecutor(jsThread);

                AssertEx.Throws<ArgumentNullException>(
                    () => executor.Call(null, "foo", new JArray()),
                    ex => Assert.AreEqual("moduleName", ex.ParamName));

                AssertEx.Throws<ArgumentNullException>(
                    () => executor.Call("foo", null, new JArray()),
                    ex => Assert.AreEqual("methodName", ex.ParamName));

                AssertEx.Throws<ArgumentNullException>(
                    () => executor.Call("foo", "bar", null),
                    ex => Assert.AreEqual("arguments", ex.ParamName));

                AssertEx.Throws<ArgumentNullException>(
                    () => executor.RunScript(null),
                    ex => Assert.AreEqual("script", ex.ParamName));

                AssertEx.Throws<ArgumentNullException>(
                    () => executor.SetGlobalVariable(null, new JArray()),
                    ex => Assert.AreEqual("propertyName", ex.ParamName));

                AssertEx.Throws<ArgumentNullException>(
                    () => executor.SetGlobalVariable("foo", null),
                    ex => Assert.AreEqual("value", ex.ParamName));

                AssertEx.Throws<ArgumentNullException>(
                    () => executor.GetGlobalVariable(null),
                    ex => Assert.AreEqual("propertyName", ex.ParamName));

                await DisposeTestExecutor(executor, jsThread);
            }
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
    }
}
