using ReactNative.UIManager.Events;
using System;
using System.Globalization;

namespace ReactNative.Views.Image
{
    /// <summary>
    /// Event class for all image loading related events.
    /// </summary>
    public class ReactImageLoadEvent : Event
    {
        /// <summary>
        /// The event identifier for image load errors.
        /// </summary>
        public const int OnError = 1;

        /// <summary>
        /// The event identifier for image load.
        /// </summary>
        public const int OnLoad = 2;

        /// <summary>
        /// The event identifier for image load end.
        /// </summary>
        public const int OnLoadEnd = 3;

        /// <summary>
        /// The event identifier for image load start.
        /// </summary>
        public const int OnLoadStart = 4;

        /// <summary>
        /// The event identifier for image load progress.
        /// </summary>
        public const int OnProgress = 5;

        private readonly int _eventType;

        /// <summary>
        /// Instantiates a <see cref="ReactImageLoadEvent"/>.
        /// </summary>
        /// <param name="viewId">The view identifier.</param>
        /// <param name="eventType">The event identifier.</param>
        public ReactImageLoadEvent(int viewId, int eventType) 
            : base(viewId, TimeSpan.FromTicks(Environment.TickCount))
        {
            _eventType = eventType;
        }

        /// <summary>
        /// The name of the event.
        /// </summary>
        public override string EventName
        {
            get
            {
                switch (_eventType)
                {
                    case OnError:
                        return "topError";
                    case OnLoad:
                        return "topLoad";
                    case OnLoadEnd:
                        return "topLoadEnd";
                    case OnLoadStart:
                        return "topLoadStart";
                    case OnProgress:
                        return "topProgress";
                    default:
                        throw new InvalidOperationException(
                            $"Invalid image event '{_eventType}'.");
                }
            }
        }

        /// <summary>
        /// The coalescing key for the event.
        /// </summary>
        public override short CoalescingKey
        {
            get
            {
                return (short)_eventType;
            }
        }

        /// <summary>
        /// Dispatches the event.
        /// </summary>
        /// <param name="eventEmitter">The event emitter.</param>
        public override void Dispatch(RCTEventEmitter eventEmitter)
        {
            eventEmitter.receiveEvent(ViewTag, EventName, null);
        }
    }
}