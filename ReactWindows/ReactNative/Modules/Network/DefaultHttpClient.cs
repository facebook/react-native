using System;
using System.Threading;
using System.Threading.Tasks;
using Windows.Web.Http;

namespace ReactNative.Modules.Network
{
    class DefaultHttpClient : IHttpClient
    {
        private readonly HttpClient _client;

        public DefaultHttpClient()
            : this(new HttpClient())
        {
        }

        public DefaultHttpClient(HttpClient client)
        {
            _client = client;
        }

        public async Task<HttpResponseMessage> SendRequestAsync(HttpRequestMessage request, CancellationToken token)
        {
            var asyncInfo = _client.SendRequestAsync(request);
            using (token.Register(asyncInfo.Cancel))
            {
                try
                {
                    return await asyncInfo;
                }
                catch (OperationCanceledException)
                {
                    token.ThrowIfCancellationRequested();
                    throw;
                }
            }
        }
    }
}
