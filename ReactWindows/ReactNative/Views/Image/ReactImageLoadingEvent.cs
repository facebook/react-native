using Newtonsoft.Json.Linq;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Views.Image
{
    /// <summary>
    /// Bubbles up load on start events for <see cref="Image"/> based controls up to <see cref="RCTEventEmitter"/>.
    /// </summary>
    public class ReactImageLoadingEvent : EventBase
    {
        public static readonly String EVENT_NAME = "topLoadStart";

        public ReactImageLoadingEvent(int viewId) : base(viewId)
        {
        }

        public override string EventName
        {
            get
            {
                return EVENT_NAME;
            }
        }
    }
}

