using ReactNative.Bridge;
using ReactNative.Collections;
using System;
using System.Collections.Generic;
using System.Threading;

namespace ReactNative.Modules.Core
{
    /// <summary>
    /// Native module for JavaScript timer execution.
    /// </summary>
    public class Timing : ReactContextNativeModuleBase, ILifecycleEventListener
    {
        private readonly object _gate = new object();

        private readonly HeapBasedPriorityQueue<TimerData> _timers;
        private readonly Timer _timer;

        private JSTimersExecution _jsTimersModule;
        private TimerData? _next;
        private bool _suspended;

        /// <summary>
        /// Instantiates the <see cref="Timing"/> module.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        public Timing(ReactContext reactContext)
            : base(reactContext)
        {
            _timers = new HeapBasedPriorityQueue<TimerData>(Comparer<TimerData>.Create((x, y) => (int)(x.TargetTime.Ticks - y.TargetTime.Ticks)));
            _timer = new Timer(FlushTimers, null, Timeout.Infinite, Timeout.Infinite);
        }

        /// <summary>
        /// The name of the module.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RCTTiming";
            }
        }

        /// <summary>
        /// Initializes the module.
        /// </summary>
        public override void Initialize()
        {
            _jsTimersModule = Context.GetJavaScriptModule<JSTimersExecution>();
            Context.AddLifecycleEventListener(this);
        }

        /// <summary>
        /// Called when the host application suspends.
        /// </summary>
        public void OnSuspend()
        {
            lock (_gate)
            {
                _suspended = true;
                _next = null;
                _timer.Change(Timeout.Infinite, Timeout.Infinite);
            }
        }

        /// <summary>
        /// Called when the host application resumes.
        /// </summary>
        public void OnResume()
        {
            lock (_gate)
            {
                UpdateTimer(true);
            }
        }

        /// <summary>
        /// Called when the host application is destroyed.
        /// </summary>
        public void OnDestroy()
        {
            _timer.Dispose();
        }

        /// <summary>
        /// Creates a timer with the given properties.
        /// </summary>
        /// <param name="callbackId">The timer identifier.</param>
        /// <param name="duration">The duration.</param>
        /// <param name="jsSchedulingTime">
        /// The Unix timestamp when the timer was created.
        /// </param>
        /// <param name="repeat">
        /// A flag signaling if the timer should fire at intervals.
        /// </param>
        [ReactMethod]
        public void createTimer(
            int callbackId,
            int duration,
            double jsSchedulingTime,
            bool repeat)
        {
            var period = TimeSpan.FromMilliseconds(duration);
            var scheduledTime = DateTimeOffset.FromUnixTimeMilliseconds((long)jsSchedulingTime);
            var initialTargetTime = (scheduledTime + period);
            var timer = new TimerData(callbackId, initialTargetTime, period, repeat);
            
            lock (_gate)
            {
                _timers.Enqueue(timer);
                UpdateTimer(false);
            }
        }

        /// <summary>
        /// Removes a timer.
        /// </summary>
        /// <param name="timerId">The timer identifier.</param>
        [ReactMethod]
        public void deleteTimer(int timerId)
        {
            lock (_gate)
            {
                _timers.Remove(new TimerData(timerId));
                UpdateTimer(false);
            }
        }

        private void UpdateTimer(bool resume)
        {
            if (resume)
            {
                _suspended = false;
            }

            if (_suspended)
            {
                return;
            }

            if (_timers.Count == 0)
            {
                _next = null;
                _timer.Change(Timeout.Infinite, Timeout.Infinite);
            }

            if (_timers.Count > 0)
            {
                var next = _timers.Peek();
                if (!_next.HasValue || !next.Equals(_next))
                {
                    _next = next;

                    var diff = next.TargetTime - DateTimeOffset.Now;
                    if (diff < TimeSpan.Zero)
                    {
                        diff = TimeSpan.Zero;
                    }

                    _timer.Change((int)Math.Ceiling(diff.TotalMilliseconds), Timeout.Infinite);
                }
            }
        }

        private void FlushTimers(object state)
        {
            var ready = new List<int>();

            lock (_gate)
            {
                while (_timers.Count > 0)
                {
                    var next = _timers.Peek();
                    if (next.TargetTime < DateTimeOffset.Now)
                    {
                        _timers.Dequeue();
                        ready.Add(next.CallbackId);
                        next.Increment();

                        if (next.CanExecute)
                        {
                            _timers.Enqueue(next);
                        }
                    }
                    else
                    {
                        break;
                    }
                }

                if (_timers.Count > 0)
                {
                    UpdateTimer(false);
                }
            }

            if (ready.Count > 0)
            {
                _jsTimersModule.callTimers(ready);
            }
        }

        struct TimerData : IEquatable<TimerData>
        {
            private readonly bool _repeat;

            public TimerData(int callbackId)
            {
                CallbackId = callbackId;
                TargetTime = DateTimeOffset.MaxValue;
                Period = default(TimeSpan);
                _repeat = false;
                CanExecute = false;
            }

            public TimerData(int callbackId, DateTimeOffset initialTargetTime, TimeSpan period, bool repeat)
            {
                CallbackId = callbackId;
                TargetTime = initialTargetTime;
                Period = period;
                _repeat = repeat;

                CanExecute = true;
            }

            public int CallbackId { get; }

            public DateTimeOffset TargetTime { get; private set; }

            public TimeSpan Period { get; }

            public bool CanExecute { get; private set; }

            public void Increment()
            {
                CanExecute = _repeat;
                TargetTime += Period;
            }

            public bool Equals(TimerData other)
            {
                return CallbackId == other.CallbackId &&
                    (TargetTime == other.TargetTime ||
                    TargetTime == DateTimeOffset.MaxValue ||
                    other.TargetTime == DateTimeOffset.MaxValue);
            }

            public override bool Equals(object obj)
            {
                if (obj is TimerData)
                {
                    return Equals((TimerData)obj);
                }

                return false;
            }

            public override int GetHashCode()
            {
                return CallbackId.GetHashCode();
            }
        }
    }
}
