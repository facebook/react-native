using Microsoft.VisualStudio.TestPlatform.UnitTestFramework;
using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Modules.Core;
using ReactNative.Modules.Network;
using System;
using System.Collections.Generic;
using System.IO;
using System.IO.Compression;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using Windows.Web.Http;

namespace ReactNative.Tests.Modules.Network
{
    [TestClass]
    public class NetworkingModuleTests
    {
        [TestMethod]
        public void NetworkingModule_ArgumentChecks()
        {
            var module = CreateNetworkingModule(new DefaultHttpClient(), new MockInvocationHandler());

            AssertEx.Throws<ArgumentNullException>(
                () => module.sendRequest(null, new Uri("http://example.com"), 0, null, null, false, 0),
                ex => Assert.AreEqual("method", ex.ParamName));

            AssertEx.Throws<ArgumentNullException>(
                () => module.sendRequest("get", null, 0, null, null, false, 0),
                ex => Assert.AreEqual("url", ex.ParamName));
        }

        [TestMethod]
        public void NetworkingModule_Request_Method()
        {
            var method = "GET";

            var passed = false;
            var waitHandle = new AutoResetEvent(false);
            var httpClient = new MockHttpClient(request =>
            {
                passed = request.Method.ToString() == method;
                waitHandle.Set();
                return new HttpResponseMessage(HttpStatusCode.NoContent);
            });

            var module = CreateNetworkingModule(httpClient, new MockInvocationHandler());
            module.sendRequest(method, new Uri("http://example.com"), 1, null, null, false, 1000);
            waitHandle.WaitOne();
            Assert.IsTrue(passed);
        }

        [TestMethod]
        public void NetworkingModule_Request_Headers()
        {
            var headers = new[]
            {
                new[] { "foo", "bar" },
                new[] { "X-RNTest", "42.424242" },
            };

            var passed = true;
            var waitHandle = new AutoResetEvent(false);
            var httpClient = new MockHttpClient(request =>
            {
                passed &= request.Headers["foo"] == "bar";
                passed &= request.Headers["X-RNTest"] == "42.424242";

                waitHandle.Set();
                return new HttpResponseMessage(HttpStatusCode.NoContent);
            });

            var module = CreateNetworkingModule(httpClient, new MockInvocationHandler());

            module.sendRequest("get", new Uri("http://example.com"), 1, headers, null, false, 1000);
            waitHandle.WaitOne();
            Assert.IsTrue(passed);
        }

        [TestMethod]
        public void NetworkingModule_Request_Content_String()
        {
            var data = new JObject
            {
                { "string", "Hello World" },
            };

            var headers = new[]
            {
                new[] { "Content-Type", "text/plain" },
            };

            var passed = true;
            var waitHandle = new AutoResetEvent(false);
            var module = CreateNetworkingModule(new MockHttpClient(request =>
                {
                    var body = request.Content.ReadAsStringAsync().GetResults();
                    var mediaType = request.Content.Headers.ContentType.ToString();
                    passed &= body == "Hello World";
                    passed &= mediaType == "text/plain";

                    waitHandle.Set();
                    return null;
                }),
                new MockInvocationHandler());

            module.sendRequest("post", new Uri("http://example.com"), 1, headers, data, false, 1000);
            waitHandle.WaitOne();

            Assert.IsTrue(passed);
        }

        [TestMethod]
        public void NetworkingModule_Request_Content_String_NoContentType()
        {
            var data = new JObject
            {
                { "string", "Hello World" },
            };

            var passed = true;
            var waitHandle = new AutoResetEvent(false);
            var module = CreateNetworkingModule(new DefaultHttpClient(), new MockInvocationHandler((name, args) =>
            {
                if (name != "emit" || args.Length != 2 || ((string)args[0]) != "didCompleteNetworkResponse")
                {
                    return;
                }

                var array = args[1] as JArray;
                if (array == null || array.Count != 2)
                {
                    return;
                }

                passed = true;
                waitHandle.Set();
            }));

            module.sendRequest("post", new Uri("http://example.com"), 1, null, data, false, 1000);
            waitHandle.WaitOne();

            Assert.IsTrue(passed);
        }

        [TestMethod]
        public void NetworkingModule_Request_Content_String_Gzip()
        {
            var data = new JObject
            {
                { "string", "Hello World" },
            };

            var headers = new[]
            {
                new[] { "Content-Type", "text/plain" },
                new[] { "Content-Encoding", "gzip" },
            };

            var passed = true;
            var waitHandle = new AutoResetEvent(false);
            var module = CreateNetworkingModule(new MockHttpClient(request =>
            {
                var gzipStream = new GZipStream(
                    request.Content.ReadAsInputStreamAsync()
                        .GetResults()
                        .AsStreamForRead(),
                    CompressionMode.Decompress);

                using (var reader = new StreamReader(gzipStream))
                {
                    var body = reader.ReadToEnd();
                    var mediaType = request.Content.Headers.ContentType.ToString();
                    var encoding = request.Content.Headers.ContentEncoding.ToString();
                    passed &= body == "Hello World";
                    passed &= mediaType == "text/plain";
                    passed &= encoding == "gzip";

                    waitHandle.Set();
                    return null;
                }
            }),
            new MockInvocationHandler());

            module.sendRequest("post", new Uri("http://example.com"), 1, headers, data, false, 1000);
            waitHandle.WaitOne();

            Assert.IsTrue(passed);
        }

        [TestMethod]
        public void NetworkingModule_Response_Headers()
        {
            var onReceived = new AutoResetEvent(false);
            var onComplete = new AutoResetEvent(false);
            var onReceivedData = default(JArray);
            var onCompleteData = default(JArray);
            var module = CreateNetworkingModule(new MockHttpClient(request =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.NoContent);
                response.RequestMessage = request;
                response.Headers["X-Foo"] = "bar";
                return response;
            }),
            new MockInvocationHandler((name, args) =>
            {
                if (name == "emit" && args.Length == 2)
                {
                    var eventName = args[0] as string;
                    if (eventName == "didReceiveNetworkResponse")
                    {
                        onReceivedData = args[1] as JArray;
                        onReceived.Set();
                    }
                    else if (eventName == "didCompleteNetworkResponse")
                    {
                        onCompleteData = args[1] as JArray;
                        onComplete.Set();
                    }
                }
            }));

            var uri = new Uri("http://example.com");
            module.sendRequest("get", uri, 42, null, null, false, 1000);

            onReceived.WaitOne();
            Assert.IsNotNull(onReceivedData);
            Assert.AreEqual(42, onReceivedData[0].Value<int>());
            Assert.AreEqual(204, onReceivedData[1].Value<int>());

            var headerData = onReceivedData[2].Value<JObject>();
            Assert.AreEqual("bar", headerData.Value<string>("X-Foo"));

            Assert.AreEqual(uri.AbsolutePath, onReceivedData[3].Value<string>());

            onComplete.WaitOne();
            Assert.IsNotNull(onCompleteData);
            Assert.AreEqual(42, onCompleteData[0].Value<int>());
            Assert.IsNull(onCompleteData[1].Value<string>());
        }

        [TestMethod]
        public void NetworkingModule_Response_Content()
        {
            var onReceived = new AutoResetEvent(false);
            var onReceivedData = default(JArray);

            var module = CreateNetworkingModule(new MockHttpClient(request =>
            {
                var response = new HttpResponseMessage(HttpStatusCode.Ok);
                response.RequestMessage = request;

                var stream = new MemoryStream();

                response.Content = new HttpStreamContent(stream.AsInputStream());
                using (var streamWriter = new StreamWriter(stream, Encoding.UTF8, 1024, true))
                {
                    streamWriter.Write("Hello World");
                }

                stream.Position = 0;
                return response;
            }),
            new MockInvocationHandler((name, args) =>
            {
                if (name == "emit" && args.Length == 2)
                {
                    var eventName = args[0] as string;
                    if (eventName == "didReceiveNetworkData")
                    {
                        onReceivedData = args[1] as JArray;
                        onReceived.Set();
                    }
                }
            }));

            var uri = new Uri("http://example.com");
            module.sendRequest("get", uri, 42, null, null, false, 1000);

            onReceived.WaitOne();
            Assert.AreEqual(42, onReceivedData[0].Value<int>());
            Assert.AreEqual("Hello World", onReceivedData[1].Value<string>());
        }

        private static NetworkingModule CreateNetworkingModule(IHttpClient httpClient, IInvocationHandler handler)
        {
            var context = new ReactContext();

            var waitHandle = new AutoResetEvent(false);
            var ids = new List<int>();
            var eventEmitter = new RCTDeviceEventEmitter();
            eventEmitter.InvocationHandler = handler;

            var reactInstance = new TestReactInstance(eventEmitter);
            context.InitializeWithInstance(reactInstance);
            return new NetworkingModule(httpClient, context);
        }

        class TestReactInstance : MockReactInstance
        {
            private readonly object _eventEmitter;

            public TestReactInstance(RCTDeviceEventEmitter eventEmitter)
                : base()
            {
                _eventEmitter = eventEmitter;
            }

            public override T GetJavaScriptModule<T>()
            {
                if (typeof(RCTDeviceEventEmitter) == typeof(T))
                {
                    return (T)_eventEmitter;
                }

                return base.GetJavaScriptModule<T>();
            }
        }

        class MockHttpClient : IHttpClient
        {
            private readonly Func<HttpRequestMessage, HttpResponseMessage> _func;

            public MockHttpClient(Func<HttpRequestMessage, HttpResponseMessage> func)
            {
                _func = func;
            }

            public Task<HttpResponseMessage> SendRequestAsync(HttpRequestMessage request, CancellationToken token)
            {
                return Task.FromResult(_func(request));
            }
        }
    }
}
