using System;
using System.Threading.Tasks;

namespace ReactNative.Bridge.Queue
{
    /// <summary>
    /// Extension methods for <see cref="IMessageQueueThread"/>s.
    /// </summary>
    public static class MessageQueueThreadExtensions
    {
        /// <summary>
        /// Asserts <see cref="IMessageQueueThread.IsOnThread"/>, throwing if the <b>false</b>.
        /// </summary>
        /// <param name="actionQueue">The message queue thread.</param>
        /// <exception cref="InvalidOperationException">
        /// Thrown if the assertion fails.
        /// </exception>
        public static void AssertIsOnThread(this IMessageQueueThread actionQueue)
        {
            if (!actionQueue.IsOnThread())
            {
                throw new InvalidOperationException("Thread access assertion failed.");
            }
        }

        /// <summary>
        /// Calls a function on a message queue and returns a task to await the response.
        /// </summary>
        /// <typeparam name="T">Type of response.</typeparam>
        /// <param name="actionQueue">The message queue thread.</param>
        /// <param name="func">The function.</param>
        /// <returns>A task to await the result.</returns>
        public static Task<T> CallOnQueue<T>(this IMessageQueueThread actionQueue, Func<T> func)
        {
            var taskCompletionSource = new TaskCompletionSource<T>();

            actionQueue.RunOnQueue(() =>
            {
                var result = func();

                // TaskCompletionSource<T>.SetResult can call continuations
                // on the awaiter of the task completion source.
                Task.Run(() => taskCompletionSource.SetResult(result));
            });

            return taskCompletionSource.Task;
        }
    }
}
