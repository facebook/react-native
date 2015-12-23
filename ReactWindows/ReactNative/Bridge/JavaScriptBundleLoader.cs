using ReactNative.Bridge.Queue;
using System;
using System.Collections.Generic;
using System.IO;
using System.Threading.Tasks;
using Windows.Storage;

namespace ReactNative.Bridge
{
    /// <summary>
    /// This class is responsible for reading and invoking the contents of a list of scripts on the JS engine 
    /// </summary>
    public class JavaScriptBundleLoader
    {
        private readonly List<string> scriptContentList;

        public static class Builder
        {
            /// <summary>
            /// The instance builder for <see cref="JavaScriptBundleLoader" />
            /// </summary>
            /// <param name="scripts">The array of URI scripts to read</param>
            /// <returns></returns>
            public static async Task<JavaScriptBundleLoader> Build(Uri[] scripts)
            {
                var jsBuilder = new JavaScriptBundleLoader();
                await jsBuilder.readScript(scripts);

                return jsBuilder;
            }
        }

        /// <summary>
        /// Executes the script contents on the JS engine 
        /// </summary>
        /// <param name="executor">The Javascript engine</param>
        /// <param name="jsQueueThread">The message queue thread to incoke the scripts on</param>
        /// <returns></returns>
        public async Task invokeJavaScripts(IJavaScriptExecutor executor, IMessageQueueThread jsQueueThread)
        {
            await jsQueueThread.CallOnQueue(() =>
            {
                foreach (var script in scriptContentList)
                {
                    executor.RunScript(script);
                }

                return true;
            });
        }

        /// <summary>
        /// Reads an array of URI's and loads the contents into the scriptContentList
        /// </summary>
        /// <param name="scripts">The array of URIs</param>
        /// <returns></returns>
        private async Task readScript(Uri[] scripts)
        {
            foreach(var script in scripts) {
                var storageFile = await StorageFile.GetFileFromApplicationUriAsync(script);
                using (var stream = await storageFile.OpenStreamForReadAsync())
                using (var reader = new StreamReader(stream))
                {
                    scriptContentList.Add(reader.ReadToEnd());
                }
            }
        }
    }
}
