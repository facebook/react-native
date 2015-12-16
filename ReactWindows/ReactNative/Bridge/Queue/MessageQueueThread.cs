using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Globalization;
using System.Reactive.Linq;
using System.Reactive.Subjects;
using System.Threading;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.System.Threading;
using Windows.UI.Core;

namespace ReactNative.Bridge.Queue
{
    public abstract class MessageQueueThread : IMessageQueueThread, IDisposable
    {
        private bool _disposed;

        private MessageQueueThread() { }

        protected bool IsDisposed
        {
            get
            {
                return _disposed;
            }
        }

        public bool IsOnThread()
        {
            AssertNotDisposed();

            return IsOnThreadCore();
        }

        public void RunOnQueue(Action action)
        {
            if (action == null)
                throw new ArgumentNullException(nameof(action));

            AssertNotDisposed();

            Enqueue(action);
        }

        public void Dispose()
        {
            Dispose(true);
        }

        protected abstract void Enqueue(Action action);

        protected abstract bool IsOnThreadCore();

        protected virtual void Dispose(bool disposing)
        {
            if (disposing)
            {
                _disposed = true;
            }
        }

        private void AssertNotDisposed()
        {
            if (_disposed)
            {
                throw new ObjectDisposedException("this");
            }
        }

        public static MessageQueueThread Create(
            MessageQueueThreadSpec spec,
            Action<Exception> handler)
        {
            if (spec == null)
                throw new ArgumentNullException(nameof(spec));
            if (handler == null)
                throw new ArgumentNullException(nameof(handler));

            switch (spec.Kind)
            {
                case MessageQueueThreadKind.MainUi:
                    return new DispatcherMessageQueueThread(spec.Name, handler);
                case MessageQueueThreadKind.BackgroundSingleThread:
                    return new SingleBackgroundMessageQueueThread(spec.Name, handler);
                case MessageQueueThreadKind.BackgroundAnyThread:
                    return new AnyBackgroundMessageQueueThread(spec.Name, handler);
                default:
                    throw new InvalidOperationException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Unknown thread type '{0}' with name '{1}'.", 
                            spec.Kind,
                            spec.Name));
            }
        }

        class DispatcherMessageQueueThread : MessageQueueThread
        {
            private readonly string _name;
            private readonly Subject<Action> _actionObservable;
            private readonly IDisposable _subscription;

            public DispatcherMessageQueueThread(string name, Action<Exception> handler)
            {
                _name = name;
                _actionObservable = new Subject<Action>();
                _subscription = _actionObservable
                    .ObserveOnDispatcher()
                    .Subscribe(action =>
                    {
                        try
                        {
                            action();
                        }
                        catch (Exception ex)
                        {
                            handler(ex);
                        }
                    });
            }

            protected override void Enqueue(Action action)
            {
                _actionObservable.OnNext(action);
            }

            protected override bool IsOnThreadCore()
            {
                return CoreWindow.GetForCurrentThread().Dispatcher != null;
            }

            protected override void Dispose(bool disposing)
            {
                base.Dispose(disposing);
                _actionObservable.Dispose();
                _subscription.Dispose();
            }
        }

        class SingleBackgroundMessageQueueThread : MessageQueueThread
        {
            private static readonly Action s_canary = new Action(() => { });

            private readonly string _name;
            private readonly Action<Exception> _handler;
            private readonly BlockingCollection<Action> _queue;
            private readonly ThreadLocal<bool> _indicator;
            private readonly IAsyncAction _asyncAction;

            public SingleBackgroundMessageQueueThread(string name, Action<Exception> handler)
            {
                _name = name;
                _handler = handler;
                _queue = new BlockingCollection<Action>();
                _indicator = new ThreadLocal<bool>();
                _asyncAction = ThreadPool.RunAsync(_ =>
                {
                    _indicator.Value = true;
                    Run();
                }, 
                WorkItemPriority.Normal);
            }

            protected override bool IsOnThreadCore()
            {
                return _indicator.Value;
            }

            protected override void Enqueue(Action action)
            {
                _queue.Add(action);
            }

            protected override void Dispose(bool disposing)
            {
                base.Dispose(disposing);

                // Unblock the background thread.
                Enqueue(s_canary);
            }

            private void Run()
            {
                while (true)
                {
                    var action = _queue.Take();
                    if (IsDisposed)
                    {
                        break;
                    }

                    try
                    {
                        action();
                    }
                    catch (Exception ex)
                    {
                        _handler(ex);
                    }
                }
            }
        }

        class AnyBackgroundMessageQueueThread : MessageQueueThread
        {
            private readonly string _name;
            private readonly Action<Exception> _handler;
            private readonly TaskScheduler _taskScheduler;
            private readonly TaskFactory _taskFactory;

            public AnyBackgroundMessageQueueThread(string name, Action<Exception> handler)
            {
                _name = name;
                _handler = handler;
                _taskScheduler = new LimitedConcurrencyLevelTaskScheduler(1);
                _taskFactory = new TaskFactory(_taskScheduler);
            }

            protected override async void Enqueue(Action action)
            {
                await _taskFactory.StartNew(() =>
                {
                    try
                    {
                        action();
                    }
                    catch (Exception ex)
                    {
                        _handler(ex);
                    }
                });
            }

            protected override bool IsOnThreadCore()
            {
                return TaskScheduler.Current == _taskScheduler;
            }
        }
    }
}
