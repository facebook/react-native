using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using ReactNative.Views.Web.Events;
using System;
using System.Collections.Generic;
using Windows.ApplicationModel.Core;
using Windows.UI.Core;
using Windows.UI.Xaml.Controls;
using Windows.Web.Http;

namespace ReactNative.Views.Web
{
    /// <summary>
    /// A view manager responsible for rendering webview.
    /// </summary>
    public class ReactWebViewManager : SimpleViewManager<WebView>
    {
        private const string BLANK_URL = "about:blank";

        private const int CommandGoBack = 1;
        private const int CommandGoForward = 2;
        private const int CommandReload = 3;

        private readonly Dictionary<int, string> _injectedJS = new Dictionary<int, string>();

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
        /// Sets whether JavaScript is enabled or not.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="enabled"></param>
        [ReactProp("javaScriptEnabled")]
        public void SetJavaScriptEnabled(WebView view, bool enabled)
        {
            view.Settings.IsJavaScriptEnabled = enabled;
        }

        /// <summary>
        /// CSets whether Indexed DB is enabled or not.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="enabled"></param>
        [ReactProp("indexedDbEnabled")]
        public void SetIndexedDbEnabled(WebView view, bool enabled)
        {
            view.Settings.IsIndexedDBEnabled = enabled;
        }

        /// <summary>
        /// Sets the JS to be injected when the webpage loads.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="injectedJavaScript"></param>
        [ReactProp("injectedJavaScript")]
        public void SetInjectedJavaScript(WebView view, string injectedJavaScript)
        {
            if (_injectedJS.ContainsKey(view.GetTag()))
            {
                _injectedJS[view.GetTag()] = injectedJavaScript;
            }
            else
            {
                _injectedJS.Add(view.GetTag(), injectedJavaScript);
            }           
        }

        /// <summary>
        /// Sets webview source.
        /// </summary>
        /// <param name="view">a webview instance.</param>
        /// <param name="source"></param>
        [ReactProp("source")]
        public void SetSource(WebView view, JObject source)
        {
            if (source != null)
            {
                var html = source.Value<string>("html");
                if (html != null)
                {
                    var baseUrl = source.Value<string>("baseUrl");
                    if (baseUrl != null)
                    {
                        view.Source = new Uri(baseUrl);
                    }

                    view.NavigateToString(html);
                    return;
                }

                var uri = source.Value<string>("uri");
                if (uri != null)
                {
                    var request = new HttpRequestMessage();
                    request.RequestUri = new Uri(uri);

                    var method = source.Value<string>("method");
                    if (method != null)
                    {
                        if (method.Equals("GET"))
                        {
                            request.Method = HttpMethod.Get;
                        }
                        else if (method.Equals("POST"))
                        {
                            request.Method = HttpMethod.Post;
                        }
                        else
                        {
                            return;
                        }
                    }
                    else
                    {
                        request.Method = HttpMethod.Get;
                    }

                    var headers = source.Value<string>("headers");
                    if (headers != null)
                    {
                        IEnumerator<KeyValuePair<string, JToken>> enumerator = ((JObject)headers).GetEnumerator();
                        enumerator.Reset();
                        while (enumerator.MoveNext())
                        {
                            request.Headers.Append(enumerator.Current.Key, enumerator.Current.Value.Value<string>());
                        }
                    }

                    var body = source.Value<string>("body");
                    if (body != null)
                    {
                        request.Content = new HttpStringContent(body);
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
        public override void ReceiveCommand(WebView view, int commandId, JArray args)
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
        public override void OnDropViewInstance(ThemedReactContext reactContext, WebView view)
        {
            view.NavigationCompleted -= OnNavigationCompleted;
            view.NavigationStarting -= OnNavigationStarting;
        }

        /// <summary>
        /// Creates a new view instance of type <see cref="WebView"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override WebView CreateViewInstance(ThemedReactContext reactContext)
        {
            return new WebView();
        }

        /// <summary>
        /// Subclasses can override this method to install custom event 
        /// emitters on the given view.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, WebView view)
        {
            view.NavigationCompleted += OnNavigationCompleted;
            view.NavigationStarting += OnNavigationStarting;
        }

        private void OnNavigationCompleted(object sender, WebViewNavigationCompletedEventArgs e)
        {
            var webView = (WebView)sender;
            var reactContext = webView.GetReactContext();

            if (e.IsSuccess)
            {
                var script = default(string);

                if (_injectedJS.TryGetValue(webView.GetTag(), out script) && script.Length > 0)
                {
                    string[] args = { script };
                    RunOnDispatcher(async () =>
                    {
                        try
                        {
                            await webView.InvokeScriptAsync("eval", args);
                        }
                        catch (Exception)
                        {
                            // Invalid script
                        }
                    });
                }

                var uri = e.Uri?.ToString();

                reactContext.GetNativeModule<UIManagerModule>()
                    .EventDispatcher
                    .DispatchEvent(
                         new WebViewLoadingEvent(
                            webView.GetTag(),
                            WebViewLoadingEvent.LoadingEventType.Finish,
                            uri,
                            false,
                            webView.DocumentTitle,
                            webView.CanGoBack,
                            webView.CanGoForward));
            }
            else
            {
                reactContext.GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new WebViewLoadingErrorEvent(
                        webView.GetTag(),
                        e.WebErrorStatus));
            }      
        }

        private void OnNavigationStarting(object sender, WebViewNavigationStartingEventArgs e)
        {
            var webView = (WebView)sender;
            var reactContext = webView.GetReactContext();

            var uri = e.Uri?.ToString();

            reactContext.GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new WebViewLoadingEvent(
                         webView.GetTag(),
                         WebViewLoadingEvent.LoadingEventType.Start,
                         uri, 
                         true, 
                         webView.DocumentTitle, 
                         webView.CanGoBack, 
                         webView.CanGoForward));
        }

        private static async void RunOnDispatcher(DispatchedHandler action)
        {
            await CoreApplication.MainView.CoreWindow.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, action);
        }
    }
}
