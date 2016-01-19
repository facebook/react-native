using ReactNative.Bridge.Queue;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Abstract context wrapper for the catalyst instance to manage
    /// lifecycle events.
    /// </summary>
    public class ReactContext
    {
        private readonly ReaderWriterLockSlim _lock = new ReaderWriterLockSlim();
        private readonly List<ILifecycleEventListener> _lifecycleEventListeners =
            new List<ILifecycleEventListener>();

        private ICatalystInstance _catalystInstance;

        /// <summary>
        /// The catalyst instance associated with the context.
        /// </summary>
        public ICatalystInstance CatalystInstance
        {
            get
            {
                AssertCatalystInstance();
                return _catalystInstance;
            }
        }

        /// <summary>
        /// Checks if the context has an active <see cref="ICatalystInstance"/>.
        /// </summary>
        public bool HasActiveCatalystInstance
        {
            get
            {
                return _catalystInstance != null && !_catalystInstance.IsDisposed;
            }
        }

        /// <summary>
        /// The exception handler for native module calls.
        /// </summary>
        public Action<Exception> NativeModuleCallExceptionHandler
        {
            get;
            set;
        }

        /// <summary>
        /// Gets the instance of the <see cref="IJavaScriptModule"/> associated
        /// with the <see cref="ICatalystInstance"/>.
        /// </summary>
        /// <typeparam name="T">Type of JavaScript module.</typeparam>
        /// <returns>The JavaScript module instance.</returns>
        public T GetJavaScriptModule<T>() 
            where T : IJavaScriptModule
        {
            AssertCatalystInstance();
            return _catalystInstance.GetJavaScriptModule<T>();
        }

        /// <summary>
        /// Gets the instance of the <see cref="INativeModule"/> associated
        /// with the <see cref="ICatalystInstance"/>.
        /// </summary>
        /// <typeparam name="T">Type of native module.</typeparam>
        /// <returns>The native module instance.</returns>
        public T GetNativeModule<T>()
            where T : INativeModule
        {
            AssertCatalystInstance();
            return _catalystInstance.GetNativeModule<T>();
        }

        /// <summary>
        /// Adds a lifecycle event listener to the context.
        /// </summary>
        /// <param name="listener">The listener.</param>
        public void AddLifecycleEventListener(ILifecycleEventListener listener)
        {
            _lock.EnterWriteLock();
            try
            {
                _lifecycleEventListeners.Add(listener);
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }

        /// <summary>
        /// Removes a lifecycle event listener from the context.
        /// </summary>
        /// <param name="listener">The listener.</param>
        public void RemoveLifecycleEventListener(ILifecycleEventListener listener)
        {
            _lock.EnterWriteLock();
            try
            {
                _lifecycleEventListeners.Remove(listener);
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }

        /// <summary>
        /// Called by the host when the application suspends.
        /// </summary>
        public void OnSuspend()
        {
            DispatcherHelpers.AssertOnDispatcher();

            var clone = default(List<ILifecycleEventListener>);

            _lock.EnterReadLock();
            try
            {
                clone = _lifecycleEventListeners.ToList(/* clone */);
            }
            finally
            {
                _lock.ExitReadLock();
            }

            foreach (var listener in clone)
            {
                listener.OnSuspend();
            }
        }

        /// <summary>
        /// Called by the host when the application resumes.
        /// </summary>
        public void OnResume()
        {
            DispatcherHelpers.AssertOnDispatcher();

            var clone = default(List<ILifecycleEventListener>);

            _lock.EnterReadLock();
            try
            {
                clone = _lifecycleEventListeners.ToList(/* clone */);
            }
            finally
            {
                _lock.ExitReadLock();
            }

            foreach (var listener in clone)
            {
                listener.OnResume();
            }
        }

        /// <summary>
        /// Called by the host when the application shuts down.
        /// </summary>
        public void OnDestroy()
        {
            DispatcherHelpers.AssertOnDispatcher();

            var clone = default(List<ILifecycleEventListener>);

            _lock.EnterReadLock();
            try
            {
                clone = _lifecycleEventListeners.ToList(/* clone */);
            }
            finally
            {
                _lock.ExitReadLock();
            }

            foreach (var listener in clone)
            {
                listener.OnDestroy();
            }

            var catalystInstance = _catalystInstance;
            if (catalystInstance != null)
            {
                catalystInstance.Dispose();
            }
        }

        /// <summary>
        /// Checks if the current thread is on the catalyst instance dispatcher
        /// queue thread.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the call is from the dispatcher queue thread,
        ///  <b>false</b> otherwise.
        /// </returns>
        public bool IsOnDispatcherQueueThread()
        {
            AssertCatalystInstance();
            return _catalystInstance.QueueConfiguration.DispatcherQueueThread.IsOnThread();
        }

        /// <summary>
        /// Asserts that the current thread is on the catalyst instance native
        /// modules queue thread.
        /// </summary>
        public void AssertOnDispatcherQueueThread()
        {
            AssertCatalystInstance();
            _catalystInstance.QueueConfiguration.DispatcherQueueThread.AssertOnThread();
        }

        /// <summary>
        /// Enqueues an action on the dispatcher queue thread.
        /// </summary>
        /// <param name="action">The action.</param>
        public void RunOnDispatcherQueueThread(Action action)
        {
            AssertCatalystInstance();
            _catalystInstance.QueueConfiguration.DispatcherQueueThread.RunOnQueue(action);
        }

        /// <summary>
        /// Checks if the current thread is on the catalyst instance
        /// JavaScript queue thread.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the call is from the JavaScript queue thread,
        /// <b>false</b> otherwise.
        /// </returns>
        public bool IsOnJavaScriptQueueThread()
        {
            AssertCatalystInstance();
            return _catalystInstance.QueueConfiguration.JavaScriptQueueThread.IsOnThread();
        }

        /// <summary>
        /// Asserts that the current thread is on the catalyst instance
        /// JavaScript queue thread.
        /// </summary>
        public void AssertOnJavaScriptQueueThread()
        {
            AssertCatalystInstance();
            _catalystInstance.QueueConfiguration.JavaScriptQueueThread.AssertOnThread();
        }

        /// <summary>
        /// Enqueues an action on the JavaScript queue thread.
        /// </summary>
        /// <param name="action">The action.</param>
        public void RunOnJavaScriptQueueThread(Action action)
        {
            AssertCatalystInstance();
            _catalystInstance.QueueConfiguration.JavaScriptQueueThread.RunOnQueue(action);
        }

        /// <summary>
        /// Checks if the current thread is on the catalyst instance native 
        /// modules queue thread.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the call is from the native modules queue thread,
        /// <b>false</b> otherwise.
        /// </returns>
        public bool IsOnNativeModulesQueueThread()
        {
            AssertCatalystInstance();
            return _catalystInstance.QueueConfiguration.NativeModulesQueueThread.IsOnThread();
        }

        /// <summary>
        /// Asserts that the current thread is on the catalyst instance native
        /// modules queue thread.
        /// </summary>
        public void AssertOnNativeModulesQueueThread()
        {
            AssertCatalystInstance();
            _catalystInstance.QueueConfiguration.NativeModulesQueueThread.AssertOnThread();
        }

        /// <summary>
        /// Enqueues an action on the native modules queue thread.
        /// </summary>
        /// <param name="action">The action.</param>
        public void RunOnNativeModulesQueueThread(Action action)
        {
            AssertCatalystInstance();
            _catalystInstance.QueueConfiguration.NativeModulesQueueThread.RunOnQueue(action);
        }

        /// <summary>
        /// Passes the exception to the current 
        /// <see cref="NativeModuleCallExceptionHandler"/>, if set, otherwise
        /// rethrows.
        /// </summary>
        /// <param name="exception"></param>
        public void HandleException(Exception exception)
        {
            var nativeModuleCallExceptionHandler = NativeModuleCallExceptionHandler;
            if (_catalystInstance != null &&
                !_catalystInstance.IsDisposed &&
                nativeModuleCallExceptionHandler != null)
            {
                nativeModuleCallExceptionHandler(exception);
            }
            else
            {
                // TODO: consider using ExceptionServices to rethrow.
                throw exception;
            }
        }

        /// <summary>
        /// Set and initialize the <see cref="ICatalystInstance"/> instance
        /// for this context.
        /// </summary>
        /// <param name="instance">The catalyst instance.</param>
        /// <remarks>
        /// This method should be called exactly once.
        /// </remarks>
        internal void InitializeWithInstance(ICatalystInstance instance)
        {
            if (instance == null)
                throw new ArgumentNullException(nameof(instance));

            if (_catalystInstance != null)
            {
                throw new InvalidOperationException("Catalyst instance has already been set.");
            }

            _catalystInstance = instance;
        }

        private void AssertCatalystInstance()
        {
            if (_catalystInstance == null)
            {
                throw new InvalidOperationException("Catalyst instance has not been set.");
            }
        }
    }
}
