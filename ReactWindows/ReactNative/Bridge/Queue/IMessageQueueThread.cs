using System;
using System.Threading.Tasks;

namespace ReactNative.Bridge.Queue
{
    public interface IMessageQueueThread
    {
        /// <summary>
        /// Runs the given action on this thread. 
        /// </summary>
        /// <remarks>
        /// The action will be submitted to the end of the event queue
        /// even if it is being submitted from the same queue Thread.
        /// </remarks>
        /// <param name="action">The action.</param>
        void RunOnQueue(Action action);

        /// <summary>
        /// Checks whether the current thread is also the thread 
        /// associated with this <see cref="IMessageQueueThread"/>.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the current thread is associated with this
        /// instance, <b>false</b> otherwise.
        /// </returns>
        bool IsOnThread();
    }
}
