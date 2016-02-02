using System;

namespace ReactNative.UIManager.Events
{
    /// <summary>
    /// A UI event that can be dispatched to JavaScript.
    /// </summary>
    /// <remarks>
    /// For dispatching events, <see cref="EventDispatcher.DispatchEvent(Event)"/>
    /// should be used. Once the object is passed to the <see cref="EventDispatcher"/>
    /// it should no longer be used, as <see cref="EventDispatcher"/> may
    /// decide to recycle that object (by calling <see cref="Dispose"/>.
    /// </remarks>
    public abstract class Event : IDisposable
    {
        private bool _initialized;
        private int _viewTag;
        private TimeSpan _timestamp;

        /// <summary>
        /// Base constructor for <see cref="Event"/>.
        /// </summary>
        /// <param name="viewTag">The view tag.</param>
        /// <param name="timestamp">The event timestamp.</param>
        protected Event(int viewTag, TimeSpan timestamp)
        {
            Init(viewTag, timestamp);
        }
        
        /// <summary>
        /// The name of the event as registered in JavaScript.
        /// </summary>
        public abstract string EventName { get; }

        /// <summary>
        /// The ID of the view that generated this event.
        /// </summary>
        public int ViewTag
        {
            get
            {
                return _viewTag;
            }
        }

        /// <summary>
        /// The time at which the event happened in the 
        /// </summary>
        public TimeSpan Timestamp
        {
            get
            {
                return _timestamp;
            }
        }

        /// <summary>
        /// Signals if the event can be coalesced.
        /// </summary>
        /// <remarks>
        /// Return false if the event can never be coalesced.
        /// </remarks>
        public virtual bool CanCoalesce
        {
            get
            {
                return true;
            }
        }

        /// <summary>
        /// Signals if the event has been initialized.
        /// </summary>
        public bool IsInitialized
        {
            get
            {
                return _initialized;
            }
        }

        /// <summary>
        /// A key used to determine which other events of this type this event
        /// can be coalesced with. For example, touch move events should only
        /// be coalesced within a single gesture, so a coalescing key there
        /// would be the unique gesture identifier.
        /// </summary>
        public virtual short CoalescingKey
        {
            get
            {
                return 0;
            }
        }

        /// <summary>
        /// Given two events, coalesce them into a single event that will be
        /// sent to JavaScript instead of two separate events.
        /// </summary>
        /// <param name="otherEvent">The other event.</param>
        /// <returns>The coalesced event.</returns>
        /// <remarks>
        /// By default, just chooses the one that is more recent. Two events
        /// will only ever try to be coalesced if they have the same event
        /// name, view ID, and coalescing key.
        /// </remarks>
        public virtual Event Coalesce(Event otherEvent)
        {
            return Timestamp > otherEvent.Timestamp ? this : otherEvent;
        }

        /// <summary>
        /// Dispatch this event to JavaScript using the given event emitter.
        /// </summary>
        /// <param name="eventEmitter">The event emitter.</param>
        public abstract void Dispatch(RCTEventEmitter eventEmitter);

        /// <summary>
        /// Disposes the event.
        /// </summary>
        public void Dispose()
        {
            _initialized = false;
            OnDispose();
        }

        /// <summary>
        /// Initializes the event.
        /// </summary>
        /// <param name="viewTag">The view tag.</param>
        /// <param name="timestamp">The timestamp.</param>
        /// <remarks>
        /// This method must be called before the event is sent to the event
        /// dispatcher.
        /// </remarks>
        protected void Init(int viewTag, TimeSpan timestamp)
        {
            _viewTag = viewTag;
            _timestamp = timestamp;
            _initialized = true;
        }

        /// <summary>
        /// Called when the <see cref="EventDispatcher"/> is done with an 
        /// event, either because it was dispatched or because it was coalesced
        /// with another <see cref="Event"/>.
        /// </summary>
        /// <remarks>
        /// The derived class does not need to call this base method.
        /// </remarks>
        protected virtual void OnDispose()
        {
        }
    }
}
