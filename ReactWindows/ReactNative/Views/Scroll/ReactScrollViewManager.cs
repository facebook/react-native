using Newtonsoft.Json.Linq;
using ReactNative.UIManager;
using ReactNative.UIManager.Events;
using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.Views.Scroll
{
    /// <summary>
    /// The view manager for scrolling views.
    /// </summary>
    public class ReactScrollViewManager : ViewParentManager<ScrollViewer>, IScrollCommandHandler<ScrollViewer>
    {
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
        /// Sets whether scroll is enabled on the view.
        /// </summary>
        /// <param name="view">The view.</param>
        /// <param name="enabled">The enabled value.</param>
        [ReactProperty("scrollEnabled", DefaultBoolean = true)]
        public void SetEnabled(ScrollViewer view, bool enabled)
        {
            view.IsEnabled = enabled;
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
        /// Creates a new view instance.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <returns>The view instance.</returns>
        protected override ScrollViewer CreateViewInstance(ThemedReactContext reactContext)
        {
            var view = new ScrollViewer
            {
                HorizontalScrollBarVisibility = ScrollBarVisibility.Hidden,
                VerticalScrollBarVisibility = ScrollBarVisibility.Hidden,
            };

            view.ViewChanging += OnViewChanging;
            return view;
        }

        /// <summary>
        /// Called when view is detached from view hierarchy and allows for 
        /// additional cleanup by the <see cref="IViewManager"/>
        /// subclass.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="view">The view.</param>
        public override void OnDropViewInstance(ThemedReactContext reactContext, ScrollViewer view)
        {
            view.ViewChanging -= OnViewChanging;
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
            ReactScrollViewCommandHelper.ReceiveCommand(this, view, commandId, args);
        }

        /// <summary>
        /// Scroll to a specific offset.
        /// </summary>
        /// <param name="scrollView">The scroll view.</param>
        /// <param name="x">The X-coordinate.</param>
        /// <param name="y">The Y-coordinate.</param>
        /// <param name="animated">
        /// <code>true</code> if the scroll should be animated, <code>false</code> otherwise.
        /// </param>
        public void ScrollTo(ScrollViewer scrollView, double x, double y, bool animated)
        {
            if (animated)
            {
                throw new NotImplementedException("Animated scroll has not yet been implemented.");
            }

            scrollView.ScrollToHorizontalOffset(x);
            scrollView.ScrollToVerticalOffset(y);
        }

        private void OnViewChanging(object sender, ScrollViewerViewChangingEventArgs args)
        {
            var nextView = args.NextView;
            var scrollViewer = (ScrollViewer)sender;
            var reactTag = scrollViewer.GetTag();

            // Scroll position
            var contentOffset = new JObject
            {
                { "x", nextView.HorizontalOffset },
                { "y", nextView.VerticalOffset },
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

            var scrollEvent = new ScrollEvent(reactTag, ScrollEventType.Scroll, new JObject
            {
                { "target", reactTag },
                { "contentOffset", contentOffset },
                { "contentInset", contentInset },
                { "contentSize", contentSize },
                { "layoutMeasurement", layoutMeasurement },
                { "zoomScale", nextView.ZoomFactor },
            });

            scrollViewer.GetReactContext()
                .GetNativeModule<UIManagerModule>()
                .EventDispatcher
                .DispatchEvent(scrollEvent);
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
