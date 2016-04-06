using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using Windows.Devices.Input;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Input;

namespace ReactNative.Touch
{
    class TouchHandler : IDisposable
    {
        private readonly FrameworkElement _view;
        private readonly List<ReactPointer> _pointers;

        private uint _activePointers;

        public TouchHandler(FrameworkElement view)
        {
            _view = view;
            _pointers = new List<ReactPointer>();

            _view.PointerPressed += OnPointerPressed;
            _view.PointerMoved += OnPointerMoved;
            _view.PointerReleased += OnPointerReleased;
            _view.PointerCanceled += OnPointerCanceled;
            _view.PointerCaptureLost += OnPointerCaptureLost;
        }

        public void Dispose()
        {
            _view.PointerPressed -= OnPointerPressed;
            _view.PointerMoved -= OnPointerMoved;
            _view.PointerReleased -= OnPointerReleased;
            _view.PointerCanceled -= OnPointerCanceled;
            _view.PointerCaptureLost -= OnPointerCaptureLost;
        }

        private void OnPointerPressed(object sender, PointerRoutedEventArgs e)
        {
            var pointerId = e.Pointer.PointerId;
            if (IndexOfPointerWithId(pointerId) != -1)
            {
                throw new InvalidOperationException("A pointer with this ID already exists.");
            }

            var reactView = GetReactViewFromView(e.OriginalSource as FrameworkElement);
            if (reactView != null && _view.CapturePointer(e.Pointer))
            {
                var pointer = new ReactPointer();
                pointer.Target = reactView.GetTag();
                pointer.PointerId = e.Pointer.PointerId;
                pointer.Identifier = ++_activePointers;
                pointer.ReactView = reactView;
                UpdatePointerForEvent(pointer, e);

                var pointerIndex = _pointers.Count;
                _pointers.Add(pointer);
                DispatchTouchEvent(TouchEventType.Start, _pointers, pointerIndex);
            }
        }

        private void OnPointerMoved(object sender, PointerRoutedEventArgs e)
        {
            var pointerIndex = IndexOfPointerWithId(e.Pointer.PointerId);
            if (pointerIndex != -1)
            {
                var pointer = _pointers[pointerIndex];
                UpdatePointerForEvent(pointer, e);
                DispatchTouchEvent(TouchEventType.Move, _pointers, pointerIndex);
            }
        }

        private void OnPointerReleased(object sender, PointerRoutedEventArgs e)
        {
            OnPointerConcluded(TouchEventType.End, e);
        }

        private void OnPointerCanceled(object sender, PointerRoutedEventArgs e)
        {
            OnPointerConcluded(TouchEventType.Cancel, e);
        }

        private void OnPointerCaptureLost(object sender, PointerRoutedEventArgs e)
        {
            OnPointerConcluded(TouchEventType.Cancel, e);
        }

        private void OnPointerConcluded(TouchEventType touchEventType, PointerRoutedEventArgs e)
        {
            var pointerIndex = IndexOfPointerWithId(e.Pointer.PointerId);
            if (pointerIndex != -1)
            {
                var pointer = _pointers[pointerIndex];
                UpdatePointerForEvent(pointer, e);
                DispatchTouchEvent(touchEventType, _pointers, pointerIndex);

                --_activePointers;
                _pointers.RemoveAt(pointerIndex);

                _view.ReleasePointerCapture(e.Pointer);
            }
        }

        private int IndexOfPointerWithId(uint pointerId)
        {
            for (var i = 0; i < _pointers.Count; ++i)
            {
                if (_pointers[i].PointerId == pointerId)
                {
                    return i;
                }
            }

            return -1;
        }

        private FrameworkElement GetReactViewFromView(FrameworkElement originalSource)
        {
            var result = originalSource;
            while (result != null && result != _view)
            {
                if (result.HasTag())
                {
                    return result;
                }

                result = result.Parent as FrameworkElement;
            }

            return result;
        }

        private void UpdatePointerForEvent(ReactPointer pointer, PointerRoutedEventArgs e)
        {
            var viewPoint = e.GetCurrentPoint(_view);
            var positionInRoot = viewPoint.Position;
            var positionInView = e.GetCurrentPoint(pointer.ReactView).Position;

            pointer.PageX = (float)positionInRoot.X;
            pointer.PageY = (float)positionInRoot.Y;
            pointer.LocationX = (float)positionInView.X;
            pointer.LocationY = (float)positionInView.Y;
            pointer.Timestamp = viewPoint.Timestamp / 1000; // Convert microseconds to milliseconds;
        }

        private void DispatchTouchEvent(TouchEventType touchEventType, List<ReactPointer> activePointers, int pointerIndex)
        {
            var touches = new JArray();
            foreach (var pointer in activePointers)
            {
                touches.Add(JObject.FromObject(pointer));
            }

            var changedIndices = new JArray();
            changedIndices.Add(JToken.FromObject(pointerIndex));

            var touchEvent = new TouchEvent(touchEventType, touches, changedIndices);

            _view.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(touchEvent);
        }

        /// <summary>
        /// Simple touch event.
        /// </summary>
        /// <remarks>
        /// TODO: revisit how to capture active pointers and coalesce efficiently.
        /// </remarks>
        class TouchEvent : Event
        {
            private readonly TouchEventType _touchEventType;
            private readonly JArray _touches;
            private readonly JArray _changedIndices;

            public TouchEvent(TouchEventType touchEventType, JArray touches, JArray changedIndices)
                : base(-1, TimeSpan.FromTicks(Environment.TickCount))
            {
                _touchEventType = touchEventType;
                _touches = touches;
                _changedIndices = changedIndices;
            }

            public override string EventName
            {
                get
                {
                    return _touchEventType.GetJavaScriptEventName();
                }
            }

            public override bool CanCoalesce
            {
                get
                {
                    return false;
                }
            }

            public override void Dispatch(RCTEventEmitter eventEmitter)
            {
                eventEmitter.receiveTouches(EventName, _touches, _changedIndices);
            }
        }

        class ReactPointer
        {
            [JsonProperty(PropertyName = "target")]
            public int Target { get; set; }

            [JsonIgnore]
            public uint PointerId { get; set; }

            [JsonProperty(PropertyName = "identifier")]
            public uint Identifier { get; set; }

            [JsonIgnore]
            public FrameworkElement ReactView { get; set; }

            [JsonProperty(PropertyName = "timestamp")]
            public ulong Timestamp { get; set; }

            [JsonProperty(PropertyName = "locationX")]
            public float LocationX { get; set; }

            [JsonProperty(PropertyName = "locationY")]
            public float LocationY { get; set; }

            [JsonProperty(PropertyName = "pageX")]
            public float PageX { get; set; }

            [JsonProperty(PropertyName = "pageY")]
            public float PageY { get; set; }
        }
    }
}
