using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.Collections;
using System;
using System.Collections.Generic;
using System.Runtime.ExceptionServices;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.Networking.Sockets;
using Windows.Storage.Streams;

namespace ReactNative.Bridge
{
    class WebSocketJavaScriptExecutor : IJavaScriptExecutor
    {
        private const int ConnectTimeoutMilliseconds = 5000;
        private const int ConnectRetryCount = 3;

        private readonly MessageWebSocket _webSocket;
        private readonly JObject _injectedObjects;
        private readonly IDictionary<int, TaskCompletionSource<JToken>> _callbacks;

        private DataWriter _messageWriter;
        private int _requestId;
         
        public WebSocketJavaScriptExecutor()
        {
            _webSocket = new MessageWebSocket();
            _webSocket.Control.MessageType = SocketMessageType.Utf8;
            _webSocket.MessageReceived += OnMessageReceived;

            _injectedObjects = new JObject();
            _callbacks = new Dictionary<int, TaskCompletionSource<JToken>>();
        }

        public async Task ConnectAsync(string webSocketServerUrl, CancellationToken token)
        {
            var uri = default(Uri);
            if (!Uri.TryCreate(webSocketServerUrl, UriKind.Absolute, out uri))
            {
                throw new ArgumentOutOfRangeException(nameof(webSocketServerUrl), "Expected valid URI argument.");
            }

            var retryCount = ConnectRetryCount;
            while (true)
            {
                try
                {
                    await ConnectCoreAsync(uri, token);
                    return;
                }
                catch (OperationCanceledException ex)
                when (ex.CancellationToken == token)
                {
                    throw;
                }
                catch
                {
                    if (retryCount <= 0)
                    {
                        throw;
                    }
                }
            }
        }

        public JToken Call(string moduleName, string methodName, JArray arguments)
        {
            var requestId = Interlocked.Increment(ref _requestId);
            var callback = new TaskCompletionSource<JToken>();
            _callbacks.Add(requestId, callback);

            try
            {
                var request = new JObject
                {
                    { "id", requestId },
                    { "method", methodName },
                    { "arguments", arguments },
                };

                SendMessageAsync(requestId, request.ToString(Formatting.None)).Wait();
                return callback.Task.Result;
            }
            catch (AggregateException ex)
            when (ex.InnerExceptions.Count == 1)
            {
                ExceptionDispatchInfo.Capture(ex.InnerException).Throw();
                /* Should not */ throw;
            }
            finally
            {
                _callbacks.Remove(requestId);
            }
        }

        public void RunScript(string script)
        {
            var requestId = Interlocked.Increment(ref _requestId);
            var callback = new TaskCompletionSource<JToken>();
            _callbacks.Add(requestId, callback);

            try
            {
                var request = new JObject
                {
                    { "id", requestId },
                    { "method", "executeApplicationScript" },
                    { "url", script },
                    { "inject", _injectedObjects },
                };

                SendMessageAsync(requestId, request.ToString(Formatting.None)).Wait();
                callback.Task.Wait();
            }
            catch (AggregateException ex)
            when (ex.InnerExceptions.Count == 1)
            {
                ExceptionDispatchInfo.Capture(ex.InnerException).Throw();
            }
            finally
            {
                _callbacks.Remove(requestId);
            }
        }

        public void SetGlobalVariable(string propertyName, JToken value)
        {
            _injectedObjects.Add(propertyName, value.ToString(Formatting.None));
        }

        public void Dispose()
        {
            _webSocket.Dispose();
        }

        private async Task ConnectCoreAsync(Uri uri, CancellationToken token)
        {
            var asyncAction = default(IAsyncAction);
            using (token.Register(() => asyncAction?.Cancel()))
            {
                asyncAction = _webSocket.ConnectAsync(uri);
                await asyncAction;
            }

            _messageWriter = new DataWriter(_webSocket.OutputStream);
            await PrepareJavaScriptRuntimeAsync();        
        }

        private async Task PrepareJavaScriptRuntimeAsync()
        {
            var requestId = Interlocked.Increment(ref _requestId);
            var callback = new TaskCompletionSource<JToken>();
            _callbacks.Add(requestId, callback);

            try
            {
                var request = new JObject
                {
                    { "id", requestId },
                    { "method", "prepareJSRuntime" },
                };

                await SendMessageAsync(requestId, request.ToString(Formatting.None));
                await callback.Task;
            }
            finally
            {
                _callbacks.Remove(requestId);
            }
        }

        private async Task SendMessageAsync(int requestId, string message)
        {
            _messageWriter.WriteString(message);
            await _messageWriter.StoreAsync();
            // TODO: check result of `StoreAsync()`
        }

        private void OnMessageReceived(MessageWebSocket sender, MessageWebSocketMessageReceivedEventArgs args)
        {
            using (var reader = args.GetDataReader())
            {
                reader.UnicodeEncoding = UnicodeEncoding.Utf8;
                var response = reader.ReadString(reader.UnconsumedBufferLength);

                var json = JObject.Parse(response);
                if (json.ContainsKey("replyID"))
                {
                    var replyId = json.Value<int>("replyID");
                    var callback = default(TaskCompletionSource<JToken>);
                    if (_callbacks.TryGetValue(replyId, out callback))
                    {
                        var result = default(JToken);
                        if (json.TryGetValue("result", out result))
                        {
                            if (result.Type == JTokenType.String)
                            {
                                callback.SetResult(JToken.Parse(result.Value<string>()));
                            }
                            else
                            {
                                callback.SetResult(result);
                            }
                        }
                        else
                        {
                            callback.SetResult(null);
                        }
                    }
                }
            }
        }
    }
}