using System;
using Windows.UI.Core;

namespace ReactNative.Bridge
{
    static class DispatcherHelpers
    {
        public static void AssertOnDispatcher()
        {
            if (!IsOnDispatcher())
            {
                throw new InvalidOperationException("Thread does not have dispatcher access.");
            }
        }

        public static bool IsOnDispatcher()
        {
            return CoreWindow.GetForCurrentThread()?.Dispatcher != null;
        }
    }
}
