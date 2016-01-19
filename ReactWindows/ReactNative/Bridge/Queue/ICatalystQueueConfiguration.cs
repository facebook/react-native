using System;

namespace ReactNative.Bridge.Queue
{
    /// <summary>
    /// Specifies which <see cref="IMessageQueueThread"/>s must be used to run
    /// the various contexts of execution within catalyst (dispatcher, native
    /// modules, and JS). Some of these queue *may* be the same but should be
    /// coded against as if they are different.
    /// </summary>
    public interface ICatalystQueueConfiguration : IDisposable
    {
        /// <summary>
        /// The main UI thread.
        /// </summary>
        IMessageQueueThread DispatcherQueueThread { get; }

        /// <summary>
        /// The native modules thread.
        /// </summary>
        IMessageQueueThread NativeModulesQueueThread { get; }

        /// <summary>
        /// The JavaScript thread.
        /// </summary>
        IMessageQueueThread JavaScriptQueueThread { get; }
    }
}
