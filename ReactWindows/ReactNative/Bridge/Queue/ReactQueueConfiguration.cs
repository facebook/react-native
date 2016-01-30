using System;

namespace ReactNative.Bridge.Queue
{
    /// <summary>
    /// Specifies which <see cref="IMessageQueueThread"/>s must be used to run
    /// the various contexts of execution within react (dispatcher, native
    /// modules, and JS). Some of these queue *may* be the same but should be
    /// coded against as if they are different.
    /// </summary>
    class ReactQueueConfiguration : IReactQueueConfiguration
    {
        private readonly MessageQueueThread _dispatcherQueueThread;
        private readonly MessageQueueThread _nativeModulesQueueThread;
        private readonly MessageQueueThread _jsQueueThread;

        private ReactQueueConfiguration(
            MessageQueueThread dispatcherQueueThread,
            MessageQueueThread nativeModulesQueueThread,
            MessageQueueThread jsQueueThread)
        {
            _dispatcherQueueThread = dispatcherQueueThread;
            _nativeModulesQueueThread = nativeModulesQueueThread;
            _jsQueueThread = jsQueueThread;
        }

        /// <summary>
        /// The main UI thread.
        /// </summary>
        public IMessageQueueThread DispatcherQueueThread
        {
            get
            {
                return _dispatcherQueueThread;
            }
        }

        /// <summary>
        /// The native modules thread.
        /// </summary>
        public IMessageQueueThread NativeModulesQueueThread
        {
            get
            {
                return _nativeModulesQueueThread;
            }
        }

        /// <summary>
        /// The JavaScript thread.
        /// </summary>
        public IMessageQueueThread JavaScriptQueueThread
        {
            get
            {
                return _jsQueueThread;
            }
        }

        /// <summary>
        /// Disposes the queue configuration.
        /// </summary>
        /// <remarks>
        /// Should be called whenever the corresponding <see cref="IReactInstance"/>
        /// is disposed.
        /// </remarks>
        public void Dispose()
        {
            _dispatcherQueueThread.Dispose();
            _nativeModulesQueueThread.Dispose();
            _jsQueueThread.Dispose();
        }

        /// <summary>
        /// Factory for the configuration.
        /// </summary>
        /// <param name="spec">The configuration specification.</param>
        /// <param name="exceptionHandler">The exception handler.</param>
        /// <returns>The queue configuration.</returns>
        public static ReactQueueConfiguration Create(
            ReactQueueConfigurationSpec spec,
            Action<Exception> exceptionHandler)
        {
            var dispatcherThreadSpec = MessageQueueThreadSpec.DispatcherThreadSpec;
            var dispatcherThread = MessageQueueThread.Create(dispatcherThreadSpec, exceptionHandler);

            var jsThread = spec.JSQueueThreadSpec != dispatcherThreadSpec
                ? MessageQueueThread.Create(spec.JSQueueThreadSpec, exceptionHandler)
                : dispatcherThread;

            var nativeModulesThread = spec.NativeModulesQueueThreadSpec != dispatcherThreadSpec
                ? MessageQueueThread.Create(spec.NativeModulesQueueThreadSpec, exceptionHandler)
                : dispatcherThread;

            return new ReactQueueConfiguration(dispatcherThread, nativeModulesThread, jsThread);
        }
    }
}
