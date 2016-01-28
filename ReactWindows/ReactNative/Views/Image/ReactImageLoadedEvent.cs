using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Views.Image
{
    public class ReactImageLoadedEvent : EventBase
    {
        public static readonly String EVENT_NAME = "topLoadEnd";

        public ReactImageLoadedEvent(int viewId) : base(viewId)
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
