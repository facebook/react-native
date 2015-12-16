using System;
using System.Threading.Tasks;
using Windows.UI.Core;

namespace ReactNative.Tests
{
    static class DispatcherHelpers
    {
        public static async Task RunOnDispatcherAsync(Action action)
        {
            await App.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, new DispatchedHandler(action));
        }
    }
}
