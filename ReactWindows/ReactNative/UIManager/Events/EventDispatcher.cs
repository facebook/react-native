using ReactNative.Bridge;
using ReactNative.Tracing;
using System;
using System.Collections.Generic;
using System.Linq;

namespace ReactNative.UIManager.Events
{
    /// <summary>
    /// Class responsible for dispatching UI events to JavaScript. The main
    /// purpose of this class is to act as an intermediary between UI code
    /// generating events and JavaScript, making sure we don't send more events
    /// than JavaScript can process.
    /// 
    /// To use it, create a subclass of <see cref="Event"/> and call
    /// <see cref="DispatchEvent(Event)"/> whenever there is a UI event to
    /// dispatch.
    /// 
    /// This class differs from the Android implementation of React as there is
    /// no analogy to the choreographer in UWP. Instead, it is anticipated that
    /// some other component will periodically call <see cref="OnBatchComplete"/>
    /// to actually send the events to JavaScript.
    /// 
    /// If JavaScript is taking a long time processing events, then the UI
    /// events generated on the dispatcher thread can be coalesced into fewer
    /// events so that, when the dispatch occurs, we do not overload JavaScript
    /// with a ton of events and cause it to get even farther behind.
    /// 
    /// Ideally, this is unnecessary and JavaScript is fast enough to process
    /// all the events each frame, but this is a reasonable precautionary 
    /// measure.
    /// </summary>
    /// <remarks>
    /// Event cookies are used to coalesce events. They are made up of the
    /// event type ID, view tag, and a custom coalescing key.
    /// 
    /// Event Cookie Composition:
    /// VIEW_TAG_MASK =       0x00000000ffffffff
    /// EVENT_TYPE_ID_MASK =  0x0000ffff00000000
    /// COALESCING_KEY_MASK = 0xffff000000000000
    /// </remarks>
    public class EventDispatcher : ILifecycleEventListener
    {
        private static IComparer<Event> s_eventComparer = Comparer<Event>.Create((x, y) =>
        {
            if (x == null && y == null)
            {
                return 0;
            }

            if (x == null)
            {
                return -1;
            }

            if (y == null)
            {
                return 1;
            }

            var diff = x.Timestamp - y.Timestamp;
            if (diff == TimeSpan.Zero)
            {
                return 0;
            }
            else if (diff < TimeSpan.Zero)
            {
                return -1;
            }
            else
            {
                return 1;
            }
        });

        private readonly object _eventsToDispatchLock = new object();

        private readonly List<Event> _eventsToDispatch = new List<Event>();
        private readonly IDictionary<long, int> _eventCookieToLastEventIndex = new Dictionary<long, int>();
        private readonly IDictionary<string, short> _eventNameToEventId = new Dictionary<string, short>();

        private readonly ReactContext _reactContext;

        private RCTEventEmitter _rctEventEmitter;
        private EventDispatcherCallback _currentFrameCallback;

        /// <summary>
        /// Instantiates the <see cref="EventDispatcher"/>.
        /// </summary>
        /// <param name="reactContext">The context.</param>
        public EventDispatcher(ReactContext reactContext)
        {
            if (reactContext == null)
                throw new ArgumentNullException(nameof(reactContext));

            _reactContext = reactContext;
            _reactContext.AddLifecycleEventListener(this);
        }

        /// <summary>
        /// Sends the given <see cref="Event"/> to JavaScript, coalescing
        /// events if JavaScript is backed up.
        /// </summary>
        /// <param name="event">The event.</param>
        public void DispatchEvent(Event @event)
        {
            if (@event == null)
                throw new ArgumentNullException(nameof(@event));

            if (!@event.IsInitialized)
            {
                throw new ArgumentException("Dispatched event has not been initialized.", nameof(@event));
            }

            CoalesceEvent(@event);

            var currentFrameCallback = _currentFrameCallback;
            if (currentFrameCallback != null)
            {
                currentFrameCallback.Reschedule();
            }
        }

        /// <summary>
        /// Called when the host receives the resume event.
        /// </summary>
        public void OnResume()
        {
            DispatcherHelpers.AssertOnDispatcher();

            if (_currentFrameCallback != null)
            {
                throw new InvalidOperationException("Current frame callback is not null.");
            }

            if (_rctEventEmitter == null)
            {
                _rctEventEmitter = _reactContext.GetJavaScriptModule<RCTEventEmitter>();
            }

            var currentFrameCallback = new EventDispatcherCallback(this);
            _currentFrameCallback = currentFrameCallback;
            currentFrameCallback.Reschedule();
        }

        /// <summary>
        /// Called when the host is shutting down.
        /// </summary>
        public void OnDestroy()
        {
            ClearCallback();
        }

        /// <summary>
        /// Called when the host receives the suspend event.
        /// </summary>
        public void OnSuspend()
        {
            ClearCallback();
        }

        /// <summary>
        /// Called before the react instance is disposed.
        /// </summary>
        public void OnReactInstanceDispose()
        {
            ClearCallback();
        }

        private void DispatchEvents()
        {
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "DispatchEvents"))
            {
                if (_rctEventEmitter == null)
                {
                    throw new InvalidOperationException("The RCTEventEmitter must not be null.");
                }

                // Clone the events to dispatch
                var eventsToDispatch = default(List<Event>);
                lock (_eventsToDispatchLock)
                {
                    eventsToDispatch = _eventsToDispatch.ToList(/* clone */);
                    _eventsToDispatch.Clear();
                    _eventCookieToLastEventIndex.Clear();
                }

                var n = eventsToDispatch.Count;
                if (n > 1)
                {
                    eventsToDispatch.Sort(s_eventComparer);
                }

                for (var idx = 0; idx < n; ++idx)
                {
                    var e = eventsToDispatch[idx];
                    if (e == null)
                    {
                        continue;
                    }

                    e.Dispatch(_rctEventEmitter);
                    e.Dispose();
                }
            }
        }

        private void CoalesceEvent(Event e)
        {
            lock (_eventsToDispatchLock)
            {
                if (!e.CanCoalesce)
                {
                    _eventsToDispatch.Add(e);
                    return;
                }

                var eventCookie = GetEventCookie(e.ViewTag, e.EventName, e.CoalescingKey);
                var eventToAdd = default(Event);
                var eventToDispose = default(Event);
                var lastEventIdx = default(int);

                if (!_eventCookieToLastEventIndex.TryGetValue(eventCookie, out lastEventIdx))
                {
                    eventToAdd = e;
                    _eventCookieToLastEventIndex.Add(eventCookie, _eventsToDispatch.Count);
                }
                else
                {
                    var lastEvent = _eventsToDispatch[lastEventIdx];
                    var coalescedEvent = e.Coalesce(lastEvent);
                    if (coalescedEvent != lastEvent)
                    {
                        eventToAdd = coalescedEvent;
                        _eventCookieToLastEventIndex[eventCookie] = _eventsToDispatch.Count;
                        eventToDispose = lastEvent;
                        _eventsToDispatch[lastEventIdx] = null;
                    }
                    else
                    {
                        eventToDispose = e;
                    }
                }

                if (eventToAdd != null)
                {
                    _eventsToDispatch.Add(eventToAdd);
                }

                if (eventToDispose != null)
                {
                    eventToDispose.Dispose();
                }
            }
        }

        private long GetEventCookie(int viewTag, string eventName, short coalescingKey)
        {
            var eventTypeId = default(short);
            if (!_eventNameToEventId.TryGetValue(eventName, out eventTypeId))
            {
                if (_eventNameToEventId.Count == short.MaxValue)
                {
                    throw new InvalidOperationException("Overflow of event type IDs.");
                }

                eventTypeId = (short)_eventNameToEventId.Count;
                _eventNameToEventId.Add(eventName, eventTypeId);
            }

            return GetEventCookie(viewTag, eventTypeId, coalescingKey);
        }

        private long GetEventCookie(int viewTag, short eventTypeId, short coalescingKey)
        {
            return ((long)viewTag) |
                (((long)eventTypeId) & 0xffff) << 32 |
                (((long)coalescingKey) & 0xffff) << 48;
        }

        private void ClearCallback()
        {
            DispatcherHelpers.AssertOnDispatcher();
            if (_currentFrameCallback != null)
            {
                _currentFrameCallback.Stop();
                _currentFrameCallback = null;
            }
        }

        class EventDispatcherCallback
        {
            private readonly object _gate = new object();

            private readonly EventDispatcher _parent;

            private bool _scheduled;
            private bool _stopped;

            public EventDispatcherCallback(EventDispatcher parent)
            {
                _parent = parent;
            }

            public void Reschedule()
            {
                lock (_gate)
                {
                    if (!_scheduled && !_stopped)
                    {
                        _scheduled = true;

                        using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "ScheduleDispatchFrameCallback"))
                        {
                            _parent._reactContext.RunOnJavaScriptQueueThread(Run);
                        }
                    }
                }
            }

            public void Stop()
            {
                _stopped = true;
            }

            private void Run()
            {
                _scheduled = false;

                if (_stopped)
                {
                    return;
                }

                _parent.DispatchEvents();
            }
        }
    }
}
