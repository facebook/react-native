using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using Windows.System.Threading;

namespace ReactNative.Bridge.Queue
{
    /// <summary>
    /// Provides a task scheduler that ensures a maximum concurrency level while 
    /// running on top of the thread pool.
    /// </summary>
    class LimitedConcurrencyLevelTaskScheduler : TaskScheduler
    {
        // Indicates whether the current thread is processing work items.
        [ThreadStatic]
        private static bool _currentThreadIsProcessingItems;

        // The list of tasks to be executed 
        private readonly LinkedList<Task> _tasks = new LinkedList<Task>(); // protected by lock(_tasks)

        // The maximum concurrency level allowed by this scheduler. 
        private readonly int _maxDegreeOfParallelism;

        // Indicates whether the scheduler is currently processing work items. 
        private int _delegatesQueuedOrRunning = 0;

        /// <summary>
        /// Creates a new instance with the specified degree of parallelism. 
        /// </summary>
        /// <param name="maxDegreeOfParallelism">The degrees of parallelism.</param>
        public LimitedConcurrencyLevelTaskScheduler(int maxDegreeOfParallelism)
        {
            if (maxDegreeOfParallelism < 1)
            {
                throw new ArgumentOutOfRangeException(nameof(maxDegreeOfParallelism));
            }

            _maxDegreeOfParallelism = maxDegreeOfParallelism;
        }

        /// <summary>
        /// Queues a task to the scheduler. 
        /// </summary>
        /// <param name="task">The task to enqueue.</param>
        protected sealed override void QueueTask(Task task)
        {
            // Add the task to the list of tasks to be processed.  If there aren't enough 
            // delegates currently queued or running to process tasks, schedule another. 
            lock (_tasks)
            {
                _tasks.AddLast(task);
                if (_delegatesQueuedOrRunning < _maxDegreeOfParallelism)
                {
                    ++_delegatesQueuedOrRunning;
                    NotifyThreadPoolOfPendingWork();
                }
            }
        }

        /// <summary>
        /// Inform the ThreadPool that there's work to be executed for this scheduler. 
        /// </summary>
        private async void NotifyThreadPoolOfPendingWork()
        {
            await ThreadPool.RunAsync(_ =>
            {
                // Note that the current thread is now processing work items.
                // This is necessary to enable inlining of tasks into this thread.
                _currentThreadIsProcessingItems = true;

                try
                {
                    // Process all available items in the queue.
                    while (true)
                    {
                        Task item;
                        lock (_tasks)
                        {
                            // When there are no more items to be processed,
                            // note that we're done processing, and get out.
                            if (_tasks.Count == 0)
                            {
                                --_delegatesQueuedOrRunning;
                                break;
                            }

                            // Get the next item from the queue
                            item = _tasks.First.Value;
                            _tasks.RemoveFirst();
                        }

                        // Execute the task we pulled out of the queue
                        TryExecuteTask(item);
                    }
                }
                // We're done processing items on the current thread
                finally
                {
                    _currentThreadIsProcessingItems = false;
                }
            }, 
            WorkItemPriority.Normal);
        }

        /// <summary>
        /// Attempts to execute the specified task on the current thread. 
        /// </summary>
        /// <param name="task">The task to execute.</param>
        /// <param name="taskWasPreviouslyQueued">Task queue flag.</param>
        /// <returns>An indicator if the task was executed inline.</returns>
        protected sealed override bool TryExecuteTaskInline(Task task, bool taskWasPreviouslyQueued)
        {
            // If this thread isn't already processing a task, we don't support inlining
            if (!_currentThreadIsProcessingItems)
            {
                return false;
            }

            // If the task was previously queued, remove it from the queue
            if (taskWasPreviouslyQueued)
            {
                // Try to run the task. 
                if (TryDequeue(task))
                {
                    return TryExecuteTask(task);
                }
                else
                {
                    return false;
                }
            }
            else
            {
                return TryExecuteTask(task);
            }
        }

        /// <summary>
        /// Attempt to remove a previously scheduled task from the scheduler. 
        /// </summary>
        /// <param name="task">The task to dequeue.</param>
        /// <returns>An indicator if the task was dequeued.</returns>
        protected sealed override bool TryDequeue(Task task)
        {
            lock (_tasks)
            {
                return _tasks.Remove(task);
            }
        }

        /// <summary>
        /// Gets the maximum concurrency level supported by this scheduler. 
        /// </summary>
        public sealed override int MaximumConcurrencyLevel { get { return _maxDegreeOfParallelism; } }

        /// <summary>
        /// Gets an enumerable of the tasks currently scheduled on this scheduler. 
        /// </summary>
        /// <returns></returns>
        protected sealed override IEnumerable<Task> GetScheduledTasks()
        {
            bool lockTaken = false;
            try
            {
                Monitor.TryEnter(_tasks, ref lockTaken);
                if (lockTaken)
                {
                    return _tasks;
                }
                else
                {
                    throw new NotSupportedException();
                }
            }
            finally
            {
                if (lockTaken)
                {
                    Monitor.Exit(_tasks);
                }
            }
        }
    }
}
