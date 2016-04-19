using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Annotations;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;

namespace ReactNative.Views.Scroll
{
    /// <summary>
    /// The view manager for scrolling views.
    /// </summary>
    public class ReactScrollViewManager : ViewParentManager<ScrollViewer>
    {
        private const int CommandScrollTo = 1;

        /// <summary>
        /// The name of the view manager.
        /// </summary>
        public override string Name
        {
            get
            {
                return "RCTScrollView";
            }
        }

        /// <summary>
        /// The commands map for the view manager.
        /// </summary>
        public override IReadOnlyDictionary<string, object> CommandsMap
        {
            get
            {
                return new Dictionary<string, object>
                {
                    { "scrollTo", CommandScrollTo },
                };
            }
        }

        /// <summary>
        /// The exported custom direct event types.
        /// </summary>
        public override IReadOnlyDictionary<string, object> ExportedCustomDirectEventTypeConstants
        {
            get
            {
                return new Dictionary<string, object>
                {
                    {
                        ScrollEventType.BeginDrag.GetJavaScriptEventName(),
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onScrollBeginDrag" },
                        }
                    },
                    {
                        ScrollEventType.EndDrag.GetJavaScriptEventName(),
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onScrollEndDrag" },
                        }
                    },
                    {
                        ScrollEventType.Scroll.GetJavaScriptEventName(),
                        new Dictionary<string, object>
                        {
                            { "registrationName", "onScroll" },
                        }
                    }
                };
            }
        }

        /// <summary>
        /// Sets the background color of the view.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="color">The masked color value.</param>
        [ReactProp(ViewProps.BackgroundColor)]
        public void SetBackgroundColor(ScrollViewer view, uint? color)
        {
            view.Background = color.HasValue
                ? new SolidColorBrush(ColorHelpers.Parse(color.Value))
                : null;
        }

        /// <summary>
        /// Sets whether scroll is enabled on the view.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="enabled">The enabled value.</param>
        [ReactProp("scrollEnabled", DefaultBoolean = true)]
        public void SetEnabled(ScrollViewer view, bool enabled)
        {
            view.IsEnabled = enabled;
        }

        /// <summary>
        /// Sets whether horizontal scroll is enabled on the view.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="horizontal">
        /// The flag signaling whether horizontal scrolling is enabled.
        /// </param>
        [ReactProp("horizontal")]
        public void SetHorizontal(ScrollViewer view, bool? horizontal)
        {
            view.HorizontalScrollMode = horizontal ?? false
                ? ScrollMode.Auto
                : ScrollMode.Disabled;
        }

        /// <summary>
        /// Sets whether the horizontal scroll indicator is shown.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="showIndicator">
        /// The value to show the indicator or not.
        /// </param>
        [ReactProp("showsHorizontalScrollIndicator")]
        public void SetShowsHorizontalScrollIndicator(ScrollViewer view, bool? showIndicator)
        {
            view.HorizontalScrollBarVisibility =
                showIndicator ?? false
                    ? ScrollBarVisibility.Visible
                    : ScrollBarVisibility.Hidden;
        }

        /// <summary>
        /// Sets whether the vertical scroll indicator is shown.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="showIndicator">
        /// The value to show the indicator or not.
        /// </param>
        [ReactProp("showsVerticalScrollIndicator")]
        public void SetShowsVerticalScrollIndicator(ScrollViewer view, bool? showIndicator)
        {
            view.VerticalScrollBarVisibility =
                showIndicator ?? false
                    ? ScrollBarVisibility.Visible
                    : ScrollBarVisibility.Hidden;
        }

        /// <summary>
        /// Sets the content offset of the scroll view.
        /// </summary>
        /// <param name="view">The view instance.</param>
        /// <param name="contentOffset">The content offset.</param>
        [ReactProp("contentOffset")]
        public void SetContentOffset(ScrollViewer view, JObject contentOffset)
        {
            view.ViewChanging -= OnViewChanging;
            view.ChangeView(
                contentOffset.Value<double?>("x"), 
                contentOffset.Value<double>("y"), 
                null,
                true);
            view.ViewChanging += OnViewChanging;
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        /// <remarks>
        /// <see cref="ReactScrollViewManager"/> only supports one child.
        /// </remarks>
        public override void AddView(ScrollViewer parent, FrameworkElement child, int index)
        {
            if (index != 0)
            {
                throw new ArgumentOutOfRangeException(nameof(index), "ScrollViewer currently only supports one child.");
            }

            if (parent.Content != null)
            {
                throw new InvalidOperationException("ScrollViewer already has a child element.");
            }

            child.VerticalAlignment = VerticalAlignment.Top;
            child.HorizontalAlignment = HorizontalAlignment.Left;
            parent.Content = child;
        }

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        /// <remarks>
        /// <see cref="ReactScrollViewManager"/> only supports one child.
        /// </remarks>
        public override FrameworkElement GetChildAt(ScrollViewer parent, int index)
        {
            if (index != 0)
            {
                throw new ArgumentOutOfRangeException(nameof(index), "ScrollView currently only supports one child.");
            }

            return EnsureChild(parent);
        }

        /// <summary>
        /// Gets the number of children in the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        public override int GetChildCount(ScrollViewer parent)
        {
            return parent.Content != null ? 1 : 0;
        }

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        public override void RemoveAllChildren(ScrollViewer parent)
        {
            parent.Content = null;
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        /// <remarks>
        /// <see cref="ReactScrollViewManager"/> only supports one child.
        /// </remarks>
        public override void RemoveChildAt(ScrollViewer parent, int index)
        {
            if (index != 0)
            {
                throw new ArgumentOutOfRangeException(nameof(index), "ScrollView currently only supports one child.");
            }

            EnsureChild(parent);
            RemoveAllChildren(parent);
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="ReactScrollViewManager"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, ScrollViewer view)
        {
            view.ViewChanging -= OnViewChanging;
            view.DirectManipulationStarted -= OnDirectManipulationStarted;
            view.DirectManipulationCompleted -= OnDirectManipulationCompleted;
        }

        /// <summary>
        /// Receive events/commands directly from JavaScript through the 
        /// <see cref="UIManagerModule"/>.
        /// </summary>
        /// <param name="view">
        /// The view instance that should receive the command.
        /// </param>
        /// <param name="commandId">Identifer for the command.</param>
        /// <param name="args">Optional arguments for the command.</param>
        public override void ReceiveCommand(ScrollViewer view, int commandId, JArray args)
        {
            switch (commandId)
            {
                case CommandScrollTo:
                    var x = args[0].Value<double>();
                    var y = args[1].Value<double>();
                    var animated = args[2].Value<bool>();
                    ScrollTo(view, x, y, animated);
                    break;
                default:
                    throw new InvalidOperationException(
                        $"Unsupported command '{commandId}' received by '{typeof(ReactScrollViewManager)}'.");
            }
        }

        /// <summary>
        /// Creates a new view instance.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override ScrollViewer CreateViewInstance(ThemedReactContext reactContext)
        {
            return new ScrollViewer
            {
                HorizontalScrollBarVisibility = ScrollBarVisibility.Hidden,
                HorizontalScrollMode = ScrollMode.Disabled,
                VerticalScrollBarVisibility = ScrollBarVisibility.Hidden,
                VerticalScrollMode = ScrollMode.Auto,
            };
        }

        /// <summary>
        /// Adds event emitters for drag and scroll events.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view instance.</param>
        protected override void AddEventEmitters(ThemedReactContext reactContext, ScrollViewer view)
        {
            view.DirectManipulationCompleted += OnDirectManipulationCompleted;
            view.DirectManipulationStarted += OnDirectManipulationStarted;
            view.ViewChanging += OnViewChanging;
        }

        private void OnDirectManipulationCompleted(object sender, object e)
        {
            var scrollViewer = (ScrollViewer)sender;
            EmitScrollEvent(
                scrollViewer,
                ScrollEventType.EndDrag,
                scrollViewer.HorizontalOffset,
                scrollViewer.VerticalOffset,
                scrollViewer.ZoomFactor);
        }

        private void OnDirectManipulationStarted(object sender, object e)
        {
            var scrollViewer = (ScrollViewer)sender;
            EmitScrollEvent(
                scrollViewer,
                ScrollEventType.BeginDrag,
                scrollViewer.HorizontalOffset,
                scrollViewer.VerticalOffset,
                scrollViewer.ZoomFactor);
        }

        private void OnViewChanging(object sender, ScrollViewerViewChangingEventArgs args)
        {
            var nextView = args.NextView;
            var scrollViewer = (ScrollViewer)sender;
            EmitScrollEvent(
                scrollViewer,
                ScrollEventType.Scroll,
                nextView.HorizontalOffset,
                nextView.VerticalOffset,
                nextView.ZoomFactor);
        }

        private void EmitScrollEvent(
            ScrollViewer scrollViewer, 
            ScrollEventType eventType,
            double x, 
            double y,
            double zoomFactor)
        {
            var reactTag = scrollViewer.GetTag();

            // Scroll position
            var contentOffset = new JObject
            {
                { "x", x },
                { "y", y },
            };

            // Distance the content view is inset from the enclosing scroll view
            // TODO: Should these always be 0 for the XAML ScrollViewer?
            var contentInset = new JObject
            {
                { "top", 0 },
                { "bottom", 0 },
                { "left", 0 },
                { "right", 0 },
            };

            // Size of the content view
            var contentSize = new JObject
            {
                { "width", scrollViewer.ExtentWidth },
                { "height", scrollViewer.ExtentHeight },
            };

            // Size of the viewport
            var layoutMeasurement = new JObject
            {
                { "width", scrollViewer.ActualWidth },
                { "height", scrollViewer.ActualHeight },
            };

            scrollViewer.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(
                    new ScrollEvent(
                        reactTag,
                        eventType,
                        new JObject
                        {
                            { "target", reactTag },
                            { "contentOffset", contentOffset },
                            { "contentInset", contentInset },
                            { "contentSize", contentSize },
                            { "layoutMeasurement", layoutMeasurement },
                            { "zoomScale", zoomFactor },
                        }));
        }

        private static FrameworkElement EnsureChild(ScrollViewer view)
        {
            var child = view.Content;
            if (child == null)
            {
                throw new InvalidOperationException("ScrollView does not have any children.");
            }

            var frameworkElement = child as FrameworkElement;
            if (frameworkElement == null)
            {
                throw new InvalidOperationException("Invalid child element in ScrollView.");
            }

            return frameworkElement;
        }

        private static void ScrollTo(ScrollViewer scrollView, double x, double y, bool animated)
        {
            scrollView.ChangeView(x, y, null, !animated);
        }

        class ScrollEvent : Event
        {
            private readonly ScrollEventType _type;
            private readonly JObject _data;

            public ScrollEvent(int viewTag, ScrollEventType type, JObject data)
                : base(viewTag, TimeSpan.FromTicks(Environment.TickCount))
            {
                _type = type;
                _data = data;
            }

            public override string EventName
            {
                get
                {
                    return _type.GetJavaScriptEventName();
                }
            }

            public override void Dispatch(RCTEventEmitter eventEmitter)
            {
                eventEmitter.receiveEvent(ViewTag, EventName, _data);
            }
        }
    }
}
