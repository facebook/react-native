using Newtonsoft.Json.Linq;
using System;
using System.Collections.Generic;

namespace ReactNative.Views.Scroll
{
    static class ReactScrollViewCommandHelper
    {
        private const int CommandScrollTo = 1;

        public static IDictionary<string, object> CommandsMap
        {
            get
            {
                return new Dictionary<string, object>
                {
                    { "scrollTo", CommandScrollTo },
                };
            }
        }

        public static void ReceiveCommand<T>(IScrollCommandHandler<T> viewManager, T scrollView, int commandId, JArray args)
        {
            if (viewManager == null)
                throw new ArgumentNullException(nameof(viewManager));
            if (scrollView == null)
                throw new ArgumentNullException(nameof(scrollView));
            if (args == null)
                throw new ArgumentNullException(nameof(args));

            switch (commandId)
            {
                case CommandScrollTo:
                    var x = args[0].Value<double>();
                    var y = args[1].Value<double>();
                    var animated = args[2].Value<bool>();
                    viewManager.ScrollTo(scrollView, x, y, animated);
                    break;
                default:
                    throw new InvalidOperationException(
                        $"Unsupported command '{commandId}' received by '{viewManager.GetType()}'.");
            }
        }
    }
}
