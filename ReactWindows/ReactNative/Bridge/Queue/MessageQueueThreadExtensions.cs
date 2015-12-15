using System;
using System.Threading.Tasks;
using Windows.System.Threading;

namespace ReactNative.Bridge.Queue
{
    static class MessageQueueThreadExtensions
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

        public static Task<T> CallOnQueue<T>(this IMessageQueueThread actionQueue, Func<T> func)
        {
            var taskCompletionSource = new TaskCompletionSource<T>();

            actionQueue.RunOnQueue(() =>
            {
                var result = func();

                // TaskCompletionSource<T>.SetResult can call continuations
                // on the awaiter of the task completion source.
                // TODO: Prevent such thread stealing.
                taskCompletionSource.SetResult(result);
            });

            return taskCompletionSource.Task;
        }
    }
}
