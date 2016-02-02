using Newtonsoft.Json.Linq;
using ReactNative.Bridge.Queue;
using ReactNative.Common;
using ReactNative.Tracing;
using System;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Class to the JavaScript execution environment and means of transport
    /// for messages between JavaScript and the native environment.
    /// </summary>
    public class ReactBridge : IReactBridge
    {
        private static readonly JArray s_empty = new JArray();

        private readonly IJavaScriptExecutor _jsExecutor;
        private readonly IReactCallback _reactCallback;
        private readonly IMessageQueueThread _nativeModulesQueueThread;

        /// <summary>
        /// Instantiates the <see cref="IReactBridge"/>.
        /// </summary>
        /// <param name="jsExecutor">The JavaScript executor.</param>
        /// <param name="reactCallback">The native callback handler.</param>
        /// <param name="nativeModulesQueueThread">
        /// The native modules queue thread.
        /// </param>
        public ReactBridge(
            IJavaScriptExecutor jsExecutor,
            IReactCallback reactCallback,
            IMessageQueueThread nativeModulesQueueThread)
        {
            if (jsExecutor == null)
                throw new ArgumentNullException(nameof(jsExecutor));
            if (reactCallback == null)
                throw new ArgumentNullException(nameof(reactCallback));
            if (nativeModulesQueueThread == null)
                throw new ArgumentNullException(nameof(nativeModulesQueueThread));

            _jsExecutor = jsExecutor;
            _reactCallback = reactCallback;
            _nativeModulesQueueThread = nativeModulesQueueThread;
        }

        /// <summary>
        /// Calls a JavaScript function.
        /// </summary>
        /// <param name="moduleId">The module ID.</param>
        /// <param name="methodId">The method ID.</param>
        /// <param name="arguments">The arguments.</param>
        public void CallFunction(int moduleId, int methodId, JArray arguments)
        {
            var allArgs = new JArray
            {
                moduleId,
                methodId,
                arguments,
            };

            var response = _jsExecutor.Call("__fbBatchedBridge", "callFunctionReturnFlushedQueue", allArgs);

            ProcessResponse(response);
        }

        /// <summary>
        /// Invokes a JavaScript callback.
        /// </summary>
        /// <param name="callbackId">The callback ID.</param>
        /// <param name="arguments">The arguments.</param>
        public void InvokeCallback(int callbackId, JArray arguments)
        {
            var allArgs = new JArray
            {
                callbackId,
                arguments,
            };
            
            var response = _jsExecutor.Call("__fbBatchedBridge", "invokeCallbackAndReturnFlushedQueue", allArgs);

            ProcessResponse(response);
        }

        /// <summary>
        /// Sets a global JavaScript variable.
        /// </summary>
        /// <param name="propertyName">The property name.</param>
        /// <param name="jsonEncodedArgument">The JSON-encoded value.</param>
        public void SetGlobalVariable(string propertyName, string jsonEncodedArgument)
        {
            if (propertyName == null)
                throw new ArgumentNullException(nameof(propertyName));

            _jsExecutor.SetGlobalVariable(propertyName, JToken.Parse(jsonEncodedArgument));
        }

        /// <summary>
        /// Evaluates JavaScript.
        /// </summary>
        /// <param name="script">The script.</param>
        public void RunScript(string script)
        {
            if (script == null)
                throw new ArgumentNullException(nameof(script));

            _jsExecutor.RunScript(script);
            var response = _jsExecutor.Call("__fbBatchedBridge", "flushedQueue", s_empty);

            ProcessResponse(response);
        }

        private void ProcessResponse(JToken response)
        {
            var messages = response as JArray;
            if (messages == null)
            {
                Tracer.Write(ReactConstants.Tag, "Empty JavaScript Queue");
                return;
            }

            var moduleIds = messages[0].ToObject<int[]>();
            var methodIds = messages[1].ToObject<int[]>();
            var paramsArray = messages[2] as JArray;
            if (moduleIds == null || methodIds == null || paramsArray == null ||
                moduleIds.Length != methodIds.Length || moduleIds.Length != paramsArray.Count)
            {
                throw new InvalidOperationException("Unexpected React batch response.");
            }

            _nativeModulesQueueThread.RunOnQueue(() =>
            {
                for (var i = 0; i < moduleIds.Length; ++i)
                {
                    var moduleId = moduleIds[i];
                    var methodId = methodIds[i];
                    var args = (JArray)paramsArray[i];

                    _reactCallback.Invoke(moduleId, methodId, args);
                };

                _reactCallback.OnBatchComplete();
            });
        }
    }
}
