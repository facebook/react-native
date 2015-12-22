using System;
using Windows.UI.Core;

namespace ReactNative.Bridge
{
    static class DispatcherHelpers
    {
        public static void AssertOnDispatcher()
        {
            if (CoreWindow.GetForCurrentThread()?.Dispatcher == null)
            {
                throw new InvalidOperationException("Thread does not have dispatcher access.");
            }
        }
    }
}
