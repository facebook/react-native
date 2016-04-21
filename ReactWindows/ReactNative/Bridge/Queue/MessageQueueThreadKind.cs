namespace ReactNative.Bridge.Queue
{
    /// <summary>
    /// Types of <see cref="IMessageQueueThread"/>.
    /// </summary>
    public enum MessageQueueThreadKind
    {
        /// <summary>
        /// Dispatcher thread type.
        /// </summary>
        DispatcherThread,
        
        /// <summary>
        /// Single background thread type.
        /// </summary>
        BackgroundSingleThread,

        /// <summary>
        /// Any background thread type.
        /// </summary>
        BackgroundAnyThread,
    }

}
