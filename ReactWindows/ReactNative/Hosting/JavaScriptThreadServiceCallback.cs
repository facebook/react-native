namespace ReactNative.Hosting
{
    using System;

    /// <summary>
    ///     A thread service callback.
    /// </summary>
    /// <remarks>
    ///     The host can specify a background thread service when creating a runtime. If 
    ///     specified, then background work items will be passed to the host using this callback. The
    ///     host is expected to either begin executing the background work item immediately and return
    ///     true or return false and the runtime will handle the work item in-thread.
    /// </remarks>
    /// <param name="callbackFunction">The callback for the background work item.</param>
    /// <param name="callbackData">The data argument to be passed to the callback.</param>
    /// <returns>Whether the thread service will execute the callback.</returns>
    public delegate bool JavaScriptThreadServiceCallback(JavaScriptBackgroundWorkItemCallback callbackFunction, IntPtr callbackData);
}
