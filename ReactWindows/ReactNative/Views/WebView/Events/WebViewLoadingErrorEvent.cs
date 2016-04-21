using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;
using Windows.Web;

namespace ReactNative.Views.WebView.Events
{
    class WebViewLoadingErrorEvent : Event
    {
        private readonly double _code;
        private readonly string _description;

        public WebViewLoadingErrorEvent(int viewTag, WebErrorStatus error)
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
            _code = (double)error;
            _description = ErrorString(error);
        }

        public override string EventName
        {
            get
            {
                return "topLoadingError";
            }
        }

        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            var eventData = new JObject
                {
                    { "target", ViewTag },
                    { "code", _code },
                    { "description", _description },
                };

            eventEmitter.receiveEvent(ViewTag, EventName, eventData);
        }

        private string ErrorString(WebErrorStatus status)
        {
            switch (status)
            {
                case WebErrorStatus.Unknown: return "An unknown error has occurred.";
                case WebErrorStatus.CertificateCommonNameIsIncorrect: return "The SSL certificate common name does not match the web address.";
                case WebErrorStatus.CertificateExpired: return "The SSL certificate has expired.";
                case WebErrorStatus.CertificateContainsErrors: return "The SSL certificate contains errors.";
                case WebErrorStatus.CertificateRevoked: return "The SSL certificate has been revoked.";
                case WebErrorStatus.CertificateIsInvalid: return "The SSL certificate is invalid.";
                case WebErrorStatus.ServerUnreachable: return "The server is not responding.";
                case WebErrorStatus.Timeout: return "The connection has timed out.";
                case WebErrorStatus.ErrorHttpInvalidServerResponse: return "The server returned an invalid or unrecognized response.";
                case WebErrorStatus.ConnectionAborted: return "The connection was aborted.";
                case WebErrorStatus.ConnectionReset: return "The connection was reset.";
                case WebErrorStatus.Disconnected: return "The connection was ended.";
                case WebErrorStatus.HttpToHttpsOnRedirection: return "Redirected from a location to a secure location.";
                case WebErrorStatus.HttpsToHttpOnRedirection: return "Redirected from a secure location to an unsecure location.";
                case WebErrorStatus.CannotConnect: return "Cannot connect to destination.";
                case WebErrorStatus.HostNameNotResolved: return "Could not resolve provided host name.";
                case WebErrorStatus.OperationCanceled: return "The operation was canceled.";
                case WebErrorStatus.RedirectFailed: return "The request redirect failed.";
                case WebErrorStatus.UnexpectedStatusCode: return "An unexpected status code indicating a failure was received.";
                case WebErrorStatus.UnexpectedRedirection: return "A request was unexpectedly redirected.";
                case WebErrorStatus.UnexpectedClientError: return "An unexpected client-side error has occurred.";
                case WebErrorStatus.UnexpectedServerError: return "An unexpected server-side error has occurred.";
                case WebErrorStatus.MultipleChoices: return "The requested URL represents a high level grouping of which lower level selections need to be made.";
                case WebErrorStatus.MovedPermanently: return "This and all future requests should be directed to the given URI.";
                case WebErrorStatus.Found: return "The resource was found but is available in a location different from the one included in the request.";
                case WebErrorStatus.SeeOther: return "The response to the request can be found under another URI using a GET method.";
                case WebErrorStatus.NotModified: return "Indicates the resource has not been modified since last requested.";
                case WebErrorStatus.UseProxy: return "The requested resource must be accessed through the proxy given by the Location field.";
                case WebErrorStatus.TemporaryRedirect: return "The requested resource resides temporarily under a different URI.";
                case WebErrorStatus.BadRequest: return "The request cannot be fulfilled due to bad syntax.";
                case WebErrorStatus.Unauthorized: return "Authentication has failed or credentials have not yet been provided.";
                case WebErrorStatus.PaymentRequired: return "Reserved.";
                case WebErrorStatus.Forbidden: return "The server has refused the request.";
                case WebErrorStatus.NotFound: return "The requested resource could not be found but may be available again in the future.";
                case WebErrorStatus.MethodNotAllowed: return " A request was made of a resource using a request method not supported by that resource.";
                case WebErrorStatus.NotAcceptable: return "The requested resource is only capable of generating content not acceptable according to the Accept headers sent in the request.";
                case WebErrorStatus.ProxyAuthenticationRequired: return "The client must first authenticate itself with the proxy.";
                case WebErrorStatus.RequestTimeout: return "The server timed out waiting for the request.";
                case WebErrorStatus.Conflict: return "Indicates that the request could not be processed because of conflict in the request.";
                case WebErrorStatus.Gone: return "Indicates that the resource requested is no longer available and will not be available again.";
                case WebErrorStatus.LengthRequired: return "The request did not specify the length of its content, which is required by the requested resource.";
                case WebErrorStatus.PreconditionFailed: return "The server does not meet one of the preconditions that the requester put on the request.";
                case WebErrorStatus.RequestEntityTooLarge: return "The request is larger than the server is willing or able to process.";
                case WebErrorStatus.RequestUriTooLong: return "Provided URI length exceeds the maximum length the server can process.";
                case WebErrorStatus.UnsupportedMediaType: return "The request entity has a media type which the server or resource does not support.";
                case WebErrorStatus.RequestedRangeNotSatisfiable: return "The client has asked for a portion of the file, but the server cannot supply that portion.";
                case WebErrorStatus.ExpectationFailed: return "The server cannot meet the requirements of the Expect request-header field.";
                case WebErrorStatus.InternalServerError: return "A generic error message, given when no more specific message is suitable.";
                case WebErrorStatus.NotImplemented: return "The server either does not recognize the request method, or it lacks the ability to fulfill the request.";
                case WebErrorStatus.BadGateway: return "The server was acting as a gateway or proxy and received an invalid response from the upstream server.";
                case WebErrorStatus.ServiceUnavailable: return "The server is currently unavailable.";
                case WebErrorStatus.GatewayTimeout: return "The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.";
                case WebErrorStatus.HttpVersionNotSupported: return "The server does not support the HTTP protocol version used in the request.";
                default: return "An unknown error has occurred.";
            }
        }
    }
}
