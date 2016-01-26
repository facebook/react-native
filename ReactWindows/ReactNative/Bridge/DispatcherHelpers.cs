using System;
using Windows.UI.Core;

namespace ReactNative.Bridge
{
    static class DispatcherHelpers
    {
        private static CoreDispatcher _dispatcher;

        public static bool IsInitialized
        {
            get
            {
                return _dispatcher != null;
            }
        }

        public static void Initialize()
        {
            AssertOnDispatcher();
            _dispatcher = CoreWindow.GetForCurrentThread().Dispatcher;
        }

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

        public static async void RunOnDispatcher(DispatchedHandler action)
        {
            await _dispatcher.RunAsync(CoreDispatcherPriority.Normal, action);
        }
    }
}
