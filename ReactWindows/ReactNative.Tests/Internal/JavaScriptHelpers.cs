using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using ReactNative.Bridge.Queue;
using ReactNative.Hosting.Bridge;
using System;
using System.IO;
using System.Threading.Tasks;
using Windows.Storage;

namespace ReactNative.Tests
{
    static class JavaScriptHelpers
    {
        public static Task Run(Action<ChakraJavaScriptExecutor, IMessageQueueThread> action)
        {
            return Run((executor, jsQueueThread) =>
            {
                action(executor, jsQueueThread);
                return Task.FromResult(true);
            });
        }

        public static async Task Run(Func<ChakraJavaScriptExecutor, IMessageQueueThread, Task> action)
        {
            using (var jsQueueThread = CreateJavaScriptThread())
            {
                var executor = await jsQueueThread.CallOnQueue(() => new ChakraJavaScriptExecutor());
                try
                {
                    await Initialize(executor, jsQueueThread);
                    await action(executor, jsQueueThread);
                }
                finally
                {
                    await jsQueueThread.CallOnQueue(() =>
                    {
                        executor.Dispose();
                        return true;
                    });
                }
            }
        }

        public static async Task Initialize(ChakraJavaScriptExecutor executor, IMessageQueueThread jsQueueThread)
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

            await jsQueueThread.CallOnQueue(() =>
            {
                foreach (var script in scripts)
                {
                    executor.RunScript(script);
                }

                return true;
            });
        }

        private static MessageQueueThread CreateJavaScriptThread()
        {
            return MessageQueueThread.Create(MessageQueueThreadSpec.Create("js", MessageQueueThreadKind.BackgroundAnyThread), ex => { Assert.Fail(); });
        }
    }
}
