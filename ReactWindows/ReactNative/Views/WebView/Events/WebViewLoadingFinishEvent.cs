using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;

namespace ReactNative.Views.WebView.Events
{
    class WebViewLoadingFinishEvent : Event
    {
        private readonly string _url;
        private readonly bool _loading;
        private readonly string _title;
        private readonly bool _canGoBack;
        private readonly bool _canGoForward;

        public WebViewLoadingFinishEvent(int viewTag, string url, bool loading, string title, bool canGoBack, bool canGoForward)
            : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
        {
            _url = url;
            _loading = loading;
            _title = title;
            _canGoBack = canGoBack;
            _canGoForward = canGoForward;
        }

        public override string EventName
        {
            get
            {
                return "topLoadingFinish";
            }
        }

        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            var eventData = new JObject
                {
                    { "target", ViewTag },
                    { "url", _url },
                    { "loading", _loading },
                    { "title", _title },
                    { "canGoBack", _canGoBack },
                    { "canGoForward", _canGoForward }
                };

            eventEmitter.receiveEvent(ViewTag, EventName, eventData);
        }
    }
}
