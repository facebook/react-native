using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Defines which <see cref="Storyboard"/> should be used for animating
    /// layout updates for <see cref="FrameworkElement"/>.
    /// </summary>
    class LayoutUpdateAnimation : LayoutAnimation
    {
        /// <summary>
        /// Signals if the animation configuration is valid.
        /// </summary>
        protected override bool IsValid
        {
            get
            {
                return Duration > TimeSpan.Zero;
            }
        }

        /// <summary>
        /// Create a <see cref="Storyboard"/> to be used to animate the view, 
        /// based on the animation configuration supplied at initialization
        /// time and the new view position and size.
        /// </summary>
        /// <param name="view">The view to create the animation for.</param>
        /// <param name="x">The new X-coordinate for the view.</param>
        /// <param name="y">The new Y-coordinate for the view.</param>
        /// <param name="width">The new width for the view.</param>
        /// <param name="height">The new height for the view.</param>
        /// <returns>The storyboard.</returns>
        protected override Storyboard CreateAnimationCore(FrameworkElement view, int x, int y, int width, int height)
        {
            var currentX = Canvas.GetLeft(view);
            var currentY = Canvas.GetTop(view);
            var currentWidth = view.Width;
            var currentHeight = view.Height;

            var animateLocation = x != currentX || y != currentY;
            var animateSize = width != currentWidth || height != currentHeight;

            if (!animateLocation && !animateSize)
            {
                return null;
            }

            var storyboard = new Storyboard();
            if (currentX != x)
            {
                storyboard.Children.Add(
                    CreateTimeline(view, "(Canvas.Left)", currentX, x));
            }

            if (currentY != y)
            {
                storyboard.Children.Add(
                    CreateTimeline(view, "(Canvas.Top)", currentY, y));
            }

            if (currentWidth != width && currentWidth > width)
            {
                var timeline = CreateTimeline(view, "Width", currentWidth, width);
                timeline.EnableDependentAnimation = true;
                storyboard.Children.Add(timeline);
            }

            if (currentHeight != height && currentHeight > height)
            {
                var timeline = CreateTimeline(view, "Height", currentHeight, height);
                timeline.EnableDependentAnimation = true;
                storyboard.Children.Add(timeline);
            }

            return storyboard;
        }

        private DoubleAnimation CreateTimeline(FrameworkElement view, string path, double from, double to)
        {
            var timeline = new DoubleAnimation
            {
                From = from,
                To = to,
                EasingFunction = Interpolator,
                Duration = Duration,
            };

            Storyboard.SetTarget(timeline, view);
            Storyboard.SetTargetProperty(timeline, path);

            return timeline;
        }
    }
}
