using ReactNative.Bridge.Queue;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace ReactNative.Bridge
{
    /// <summary>
    /// Abstract context wrapper for the react instance to manage
    /// lifecycle events.
    /// </summary>
    public class ReactContext : IDisposable
    {
        private readonly ReaderWriterLockSlim _lock = new ReaderWriterLockSlim();
        private readonly List<ILifecycleEventListener> _lifecycleEventListeners =
            new List<ILifecycleEventListener>();

        private IReactInstance _reactInstance;

        /// <summary>
        /// The react instance associated with the context.
        /// </summary>
        public IReactInstance ReactInstance
        {
            get
            {
                AssertReactInstance();
                return _reactInstance;
            }
        }

        /// <summary>
        /// Checks if the context has an active <see cref="IReactInstance"/>.
        /// </summary>
        public bool HasActiveReactInstance
        {
            get
            {
                return _reactInstance != null && !_reactInstance.IsDisposed;
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
        /// with the <see cref="IReactInstance"/>.
        /// </summary>
        /// <typeparam name="T">Type of JavaScript module.</typeparam>
        /// <returns>The JavaScript module instance.</returns>
        public T GetJavaScriptModule<T>() 
            where T : IJavaScriptModule
        {
            AssertReactInstance();
            return _reactInstance.GetJavaScriptModule<T>();
        }

        /// <summary>
        /// Gets the instance of the <see cref="INativeModule"/> associated
        /// with the <see cref="IReactInstance"/>.
        /// </summary>
        /// <typeparam name="T">Type of native module.</typeparam>
        /// <returns>The native module instance.</returns>
        public T GetNativeModule<T>()
            where T : INativeModule
        {
            AssertReactInstance();
            return _reactInstance.GetNativeModule<T>();
        }

        /// <summary>
        /// Adds a lifecycle event listener to the context.
        /// </summary>
        /// <param name="listener">The listener.</param>
        public virtual void AddLifecycleEventListener(ILifecycleEventListener listener)
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
        public virtual void RemoveLifecycleEventListener(ILifecycleEventListener listener)
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
        public void Dispose()
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

            var reactInstance = _reactInstance;
            if (reactInstance != null)
            {
                reactInstance.Dispose();
            }
        }

        /// <summary>
        /// Checks if the current thread is on the react instance dispatcher
        /// queue thread.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the call is from the dispatcher queue thread,
        ///  <b>false</b> otherwise.
        /// </returns>
        public bool IsOnDispatcherQueueThread()
        {
            AssertReactInstance();
            return _reactInstance.QueueConfiguration.DispatcherQueueThread.IsOnThread();
        }

        /// <summary>
        /// Asserts that the current thread is on the react instance native
        /// modules queue thread.
        /// </summary>
        public void AssertOnDispatcherQueueThread()
        {
            AssertReactInstance();
            _reactInstance.QueueConfiguration.DispatcherQueueThread.AssertOnThread();
        }

        /// <summary>
        /// Enqueues an action on the dispatcher queue thread.
        /// </summary>
        /// <param name="action">The action.</param>
        public void RunOnDispatcherQueueThread(Action action)
        {
            AssertReactInstance();
            _reactInstance.QueueConfiguration.DispatcherQueueThread.RunOnQueue(action);
        }

        /// <summary>
        /// Checks if the current thread is on the react instance
        /// JavaScript queue thread.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the call is from the JavaScript queue thread,
        /// <b>false</b> otherwise.
        /// </returns>
        public bool IsOnJavaScriptQueueThread()
        {
            AssertReactInstance();
            return _reactInstance.QueueConfiguration.JavaScriptQueueThread.IsOnThread();
        }

        /// <summary>
        /// Asserts that the current thread is on the react instance
        /// JavaScript queue thread.
        /// </summary>
        public void AssertOnJavaScriptQueueThread()
        {
            AssertReactInstance();
            _reactInstance.QueueConfiguration.JavaScriptQueueThread.AssertOnThread();
        }

        /// <summary>
        /// Enqueues an action on the JavaScript queue thread.
        /// </summary>
        /// <param name="action">The action.</param>
        public void RunOnJavaScriptQueueThread(Action action)
        {
            AssertReactInstance();
            _reactInstance.QueueConfiguration.JavaScriptQueueThread.RunOnQueue(action);
        }

        /// <summary>
        /// Checks if the current thread is on the react instance native 
        /// modules queue thread.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the call is from the native modules queue thread,
        /// <b>false</b> otherwise.
        /// </returns>
        public bool IsOnNativeModulesQueueThread()
        {
            AssertReactInstance();
            return _reactInstance.QueueConfiguration.NativeModulesQueueThread.IsOnThread();
        }

        /// <summary>
        /// Asserts that the current thread is on the react instance native
        /// modules queue thread.
        /// </summary>
        public void AssertOnNativeModulesQueueThread()
        {
            AssertReactInstance();
            _reactInstance.QueueConfiguration.NativeModulesQueueThread.AssertOnThread();
        }

        /// <summary>
        /// Enqueues an action on the native modules queue thread.
        /// </summary>
        /// <param name="action">The action.</param>
        public void RunOnNativeModulesQueueThread(Action action)
        {
            AssertReactInstance();
            _reactInstance.QueueConfiguration.NativeModulesQueueThread.RunOnQueue(action);
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
            if (_reactInstance != null &&
                !_reactInstance.IsDisposed &&
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
        /// Set and initialize the <see cref="IReactInstance"/> instance
        /// for this context.
        /// </summary>
        /// <param name="instance">The react instance.</param>
        /// <remarks>
        /// This method should be called exactly once.
        /// </remarks>
        internal void InitializeWithInstance(IReactInstance instance)
        {
            if (instance == null)
                throw new ArgumentNullException(nameof(instance));

            if (_reactInstance != null)
            {
                throw new InvalidOperationException("React instance has already been set.");
            }

            _reactInstance = instance;
        }

        private void AssertReactInstance()
        {
            if (_reactInstance == null)
            {
                throw new InvalidOperationException("React instance has not been set.");
            }
        }
    }
}
