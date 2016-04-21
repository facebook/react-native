using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml.Controls;
using ReactNative.Views.WebView.Events;
using Windows.Web.Http;

namespace ReactNative.Views.WebView
{
    /// <summary>
    /// A view manager responsible for rendering webview.
    /// </summary>
    public class ReactWebViewManager : SimpleViewManager<Windows.UI.Xaml.Controls.WebView>
    {
        private const string BLANK_URL = "about:blank";

        private const int CommandGoBack = 1;
        private const int CommandGoForward = 2;
        private const int CommandReload = 3;

        private Dictionary<int, string> _injectedJS = new Dictionary<int, string>();

        /// <summary>
        /// The name of the view manager.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RCTWebView";
            }
        }

        /// <summary>
        /// The commands map for the webview manager.
        /// </summary>
        public override IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                return new Dictionary<string, object>
                {
                    { "goBack", CommandGoBack },
                    { "goForward", CommandGoForward },
                    { "reload", CommandReload },
                };
            }
        }

        /// <summary>
        /// Sets whether a JavaScript is enabled.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="enabled"></param>
        [ReactProp("javaScriptEnabled")]
        public void SetJavaScriptEnabled(Windows.UI.Xaml.Controls.WebView view, bool enabled)
        {
            view.Settings.IsJavaScriptEnabled = enabled;
        }

        /// <summary>
        /// Sets whether the webpage scales to fit the view and the user can change the scale.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="enabled"></param>
        [ReactProp("scalesPageToFit")]
        public void SetScalesPageToFit(Windows.UI.Xaml.Controls.WebView view, bool enabled)
        {    
            // No implementation       
        }

        /// <summary>
        /// Used on Android only, controls whether DOM Storage is enabled or not.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="enabled"></param>
        [ReactProp("domStorageEnabled")]
        public void SetDomStorageEnabled(Windows.UI.Xaml.Controls.WebView view, bool enabled)
        {
            // No implementation
        }

        /// <summary>
        /// Sets the user-agent for this webview.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="userAgent"></param>
        [ReactProp("userAgent")]
        public void SetUserAgent(Windows.UI.Xaml.Controls.WebView view, string userAgent)
        {
            // No implementation
        }

        /// <summary>
        /// Sets the JS to be injected when the webpage loads.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="injectedJavaScript"></param>
        [ReactProp("injectedJavaScript")]
        public void SetInjectedJavaScript(Windows.UI.Xaml.Controls.WebView view, string injectedJavaScript)
        {
            if (_injectedJS.ContainsKey(view.GetTag()))
            {
                _injectedJS.Remove(view.GetTag());
            }
            _injectedJS.Add(view.GetTag(), injectedJavaScript);
        }

        /// <summary>
        /// Sets webview source.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="source"></param>
        [ReactProp("source")]
        public void SetSource(Windows.UI.Xaml.Controls.WebView view, JObject source)
        {
            if (source != null)
            {
                JToken html, uri;

                if (source.TryGetValue("html", out html) && html.Type == JTokenType.String)
                {
                    JToken baseUrl;
                    if (source.TryGetValue("baseUrl", out baseUrl) && baseUrl.Type == JTokenType.String)
                    {
                        view.Source = new Uri(baseUrl.Value<string>());
                    }

                    view.NavigateToString(html.Value<string>());
                    return;
                }

                if (source.TryGetValue("uri", out uri) && uri.Type == JTokenType.String)
                {
                    JToken method, headers, body;

                    var request = new HttpRequestMessage();
                    request.RequestUri = new Uri(uri.Value<string>());

                    if (source.TryGetValue("method", out method) && method.Type == JTokenType.String)
                    {
                        if (method.Value<string>().Equals("GET")) request.Method = HttpMethod.Get;
                        else if (method.Value<string>().Equals("POST")) request.Method = HttpMethod.Post;
                        else return;
                    }
                    else request.Method = HttpMethod.Get;

                    if (source.TryGetValue("headers", out headers) && headers.Type == JTokenType.Object)
                    {
                        IEnumerator<KeyValuePair<string, JToken>> enumerator = ((JObject)headers).GetEnumerator();
                        enumerator.Reset();
                        while (enumerator.MoveNext())
                        {
                            if (enumerator.Current.Value.Type == JTokenType.String)
                            {
                                request.Headers.Append(enumerator.Current.Key, enumerator.Current.Value.Value<string>());
                            }
                        }
                    }

                    if (source.TryGetValue("body", out body) && body.Type == JTokenType.String)
                    {
                        request.Content = new HttpStringContent(body.Value<string>());
                    }

                    view.NavigateWithHttpRequestMessage(request);
                    return;
                }
            }
            
            view.Navigate(new Uri(BLANK_URL));
        }

        /// <summary>
        /// Receive events/commands directly from JavaScript through the 
        /// <see cref="UIManagerModule"/>.
        /// </summary>
        /// <param name="view">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public override void ReceiveCommand(Windows.UI.Xaml.Controls.WebView view, int commandId, JArray args)
        {
            switch (commandId)
            {
                case CommandGoBack:
                    if (view.CanGoBack) view.GoBack();
                    break;

                case CommandGoForward:
                    if (view.CanGoForward) view.GoForward();
                    break;

                case CommandReload:
                    view.Refresh();
                    break;

                default:
                    throw new InvalidOperationException(
                        $"Unsupported command '{commandId}' received by '{typeof(ReactWebViewManager)}'.");
            }
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ReactWebViewManager"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, Windows.UI.Xaml.Controls.WebView view)
        {
            view.NavigationCompleted -= OnNavigationCompleted;
            view.NavigationStarting -= OnNavigationStarting;
            view.NavigationFailed -= OnNavigationFailed;
        }

        /// <summary>
        /// Creates a new view instance of type <see cref="Windows.UI.Xaml.Controls.WebView"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override Windows.UI.Xaml.Controls.WebView CreateViewInstance(ThemedReactContext reactContext)
        {
            return new Windows.UI.Xaml.Controls.WebView();
        }

        /// <summary>
        /// Subclasses can override this method to install custom event 
        /// emitters on the given view.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, Windows.UI.Xaml.Controls.WebView view)
        {
            view.NavigationCompleted += OnNavigationCompleted;
            view.NavigationStarting += OnNavigationStarting;
            view.NavigationFailed += OnNavigationFailed;
        }

        private async void OnNavigationCompleted(object sender, WebViewNavigationCompletedEventArgs e)
        {
            var webView = (Windows.UI.Xaml.Controls.WebView)sender;
            var reactContext = webView.GetReactContext();
            var script = default(string);

            if (_injectedJS.TryGetValue(webView.GetTag(),out script) && script.Length > 0)
            {
                string[] args = { script };
                await webView.InvokeScriptAsync("eval", args);
            }
            
            var uri = (e.Uri != null) ? e.Uri.ToString() : default(string);

            reactContext.GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                     new WebViewLoadingFinishEvent(
                        webView.GetTag(), uri, false, webView.DocumentTitle, webView.CanGoBack, webView.CanGoForward));
        }

        private void OnNavigationStarting(object sender, WebViewNavigationStartingEventArgs e)
        {
            var webView = (Windows.UI.Xaml.Controls.WebView)sender;
            var reactContext = webView.GetReactContext();

            var uri = (e.Uri != null) ? e.Uri.ToString() : default(string);

            reactContext.GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new WebViewLoadingStartEvent(
                         webView.GetTag(), uri, true, webView.DocumentTitle, webView.CanGoBack, webView.CanGoForward));
        }

        private void OnNavigationFailed(object sender, WebViewNavigationFailedEventArgs e)
        {
            var webView = (Windows.UI.Xaml.Controls.WebView)sender;
            var reactContext = webView.GetReactContext();
            reactContext.GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new WebViewLoadingErrorEvent(
                        webView.GetTag(), e.WebErrorStatus));
        }     
    }
}
