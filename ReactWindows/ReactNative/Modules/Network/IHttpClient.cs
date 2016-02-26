using System.Threading;
using System.Threading.Tasks;
using Windows.Web.Http;

namespace ReactNative.Modules.Network
{
    /// <summary>
    /// An interface for HTTP clients.
    /// </summary>
    public interface IHttpClient
    {
        /// <summary>
        /// Send an asynchronous HTTP request.
        /// </summary>
        /// <param name="request">The HTTP request.</param>
        /// <param name="token">A cancellation token.</param>
        /// <returns>The HTTP response.</returns>
        Task<HttpResponseMessage> SendRequestAsync(HttpRequestMessage request, CancellationToken token);
    }
}
