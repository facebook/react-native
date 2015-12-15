using System;

namespace ReactNative.Bridge.Queue
{
    public interface IQueueThreadExceptionHandler
    {
        void HandleException(Exception ex);
    }
}
