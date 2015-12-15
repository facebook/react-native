using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.System.Threading;

namespace ReactNative.Bridge.Queue
{
    public abstract class MessageQueueThread : IMessageQueueThread
    {
        protected readonly ConcurrentQueue<Action> _runOnQueueQueue =
            new ConcurrentQueue<Action>();

        public abstract bool IsOnThread();

        public void RunOnQueue(Action action)
        {
            _runOnQueueQueue.Enqueue(action);
        }

        public abstract void Start();

        public MessageQueueThread Create(
            MessageQueueThreadSpec spec,
            IQueueThreadExceptionHandler handler)
        {
            switch (spec.Kind)
            {
                //case MessageQueueThreadKind.MainUi:
                //    return new DispatcherMessageQueueThread(name, handler);
                //case MessageQueueThreadKind.NewBackground:
                //    return new BackgroundMessageQueueThread(name, handler);
                default:
                    throw new InvalidOperationException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Unknown thread type '{0}' with name '{1}'.", 
                            spec.Kind,
                            spec.Name));
            }
        }
    }
}
