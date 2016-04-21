using System;
using System.Collections.Generic;
using System.Reactive.Disposables;
using System.Threading;
using System.Threading.Tasks;

namespace ReactNative.Modules.Network
{
    /// <summary>
    /// Task cancellation manager.
    /// </summary>
    /// <typeparam name="TKey">Type of key used to identify tasks.</typeparam>
    public class TaskCancellationManager<TKey>
    {
        private readonly object _gate = new object();
        private readonly IDictionary<TKey, IDisposable> _tokens;

        /// <summary>
        /// Instantiates a <see cref="TaskCancellationManager{TKey}"/>.
        /// </summary>
        public TaskCancellationManager()
            : this(EqualityComparer<TKey>.Default)
        {
        }

        /// <summary>
        /// Instantiates a <see cref="TaskCancellationManager{TKey}"/>.
        /// </summary>
        /// <param name="keyComparer">The key comparer.</param>
        public TaskCancellationManager(IEqualityComparer<TKey> keyComparer)
        {
            if (keyComparer == null)
                throw new ArgumentNullException(nameof(keyComparer));

            _tokens = new Dictionary<TKey, IDisposable>(keyComparer);
        }

        /// <summary>
        /// Number of outstanding operations being managed.
        /// </summary>
        internal int PendingOperationCount
        {
            get
            {
                return _tokens.Count;
            }
        }

        /// <summary>
        /// Adds a task to the manager.
        /// </summary>
        /// <param name="key">The task key.</param>
        /// <param name="taskFactory">The task factory.</param>
        /// <remarks>
        /// The task factory is invoked during this method call.
        /// </remarks>
        public void Add(TKey key, Func<CancellationToken, Task> taskFactory)
        {
            var disposable = new CancellationDisposable();
            lock (_gate)
            {
                _tokens.Add(key, disposable);
            }

            taskFactory(disposable.Token).ContinueWith(
                _ =>
                {
                    var removed = false;
                    lock (_gate)
                    {
                        removed = _tokens.Remove(key);
                    }

                    disposable.Dispose();
                },
                TaskContinuationOptions.ExecuteSynchronously);
        }

        /// <summary>
        /// Cancels the task with the given key.
        /// </summary>
        /// <param name="key">The task key.</param>
        public void Cancel(TKey key)
        {
            var disposable = default(IDisposable);
            lock (_gate)
            {
                _tokens.TryGetValue(key, out disposable);
            }

            disposable?.Dispose();
        }
    }
}
