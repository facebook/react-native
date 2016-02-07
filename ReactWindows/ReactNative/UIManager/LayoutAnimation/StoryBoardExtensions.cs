using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.Foundation;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Extension static functions for <see cref="Storyboard"/> instances to define the supported timeline animations.
    /// </summary>
    static class StoryboardExtensions
    {
        private const float ScalingTransitionStartXPoint = .5f;
        private const float ScalingTransitionStartYPoint = .5f;
        private const string ScalingTargetPropertyTypeNameFormat = "(UIElement.RenderTransform).(ScaleTransform.Scale{0})";
        private const string RespositionTargetPropertyTypeNameFormat = "(UIElement.RenderTransform).(TranslateTransform.{0})";

        /// <summary>
        /// Creates the opacity transitioning timeline for a alpha storyboard effect.
        /// </summary>
        /// <param name="storyboard">The storyboard to extend off.</param>
        /// <param name="easingFunc">The easing effect function to set as the animation projection.</param>
        /// <param name="view">The view that needs to be animated.</param>
        /// <param name="startingfactor">The starting point factor.</param>
        /// <param name="endFactor">The end point factor of the transition.</param>
        /// <param name="duration">The total play duration in milliseconds for the <see cref="Timeline"/>.</param>
        public static void SetOpacityTimeline(this Storyboard storyboard, EasingFunctionBase easingFunc, FrameworkElement view, 
                                              float startingfactor, float endFactor, int duration)
        {
            var timeline = new DoubleAnimation() { EasingFunction = easingFunc, From = startingfactor, To = endFactor, Duration = TimeSpan.FromMilliseconds(duration) };

            Storyboard.SetTarget(timeline, view);
            Storyboard.SetTargetProperty(timeline, "Opacity");

            storyboard.Children.Add(timeline);
        }

        /// <summary>
        /// Creates the <see cref="ScaleTransform"/> timeline to equally scale the X/Y position of a <see cref="FrameworkElement"/>.
        /// </summary>
        /// <param name="storyboard">The storyboard to extend off.</param>
        /// <param name="easingFunc">The easing effect function to set as the animation projection.</param>
        /// <param name="view">The view that needs to be animated.</param>
        /// <param name="startingfactor">The starting point factor.</param>
        /// <param name="endFactor">The end point factor of the transition.</param>
        /// <param name="speedRateRatio">The rate at which time progresses for this <see cref="Timeline"/>.</param>
        /// <param name="duration">The total play duration in milliseconds for the <see cref="Timeline"/>.</param>
        public static void SetScalingTimeline(this Storyboard storyboard, EasingFunctionBase easingFunc, FrameworkElement view, 
                                              float startingfactor, float endFactor, double speedRateRatio, int duration)
        {
            var transformation = new ScaleTransform() { ScaleX = 1, ScaleY = 1 };
            view.RenderTransform = transformation;
            view.RenderTransformOrigin = new Point(ScalingTransitionStartXPoint, ScalingTransitionStartYPoint);

            var timelineY = new DoubleAnimation() { From = startingfactor, To = endFactor, EasingFunction = easingFunc, Duration = TimeSpan.FromMilliseconds(duration), SpeedRatio = speedRateRatio };
            var timelineX = new DoubleAnimation() { From = startingfactor, To = endFactor, EasingFunction = easingFunc, Duration = TimeSpan.FromMilliseconds(duration), SpeedRatio = speedRateRatio };

            Storyboard.SetTarget(timelineX, view);
            Storyboard.SetTarget(timelineY, view);

            Storyboard.SetTargetProperty(timelineX, string.Format(ScalingTargetPropertyTypeNameFormat, "X"));
            Storyboard.SetTargetProperty(timelineY, string.Format(ScalingTargetPropertyTypeNameFormat, "Y"));

            storyboard.Children.Add(timelineX);
            storyboard.Children.Add(timelineY);
        }

        /// <summary>
        /// Creates the <see cref="TranslateTransform"/> timeline to reposition or reshape a <see cref="FrameworkElement"/>.
        /// </summary>
        /// <param name="storyboard">The storyboard to extend off.</param>
        /// <param name="easingFunc">The easing effect function to set as the animation projection.</param>
        /// <param name="view">The view that needs to be animated.</param>
        /// <param name="newX">The new X position to move the <see cref="FrameworkElement"/> to.</param>
        /// <param name="newY">The new Y position to move the <see cref="FrameworkElement"/> to.</param>
        /// <param name="newWidth">The new targeted width for the <see cref="FrameworkElement"/>.</param>
        /// <param name="newHeight">The new targeted height for the <see cref="FrameworkElement"/>.</param>
        /// <param name="duration">The total play duration in milliseconds for the timeline.</param>
        public static void SetRepositionTimelines(this Storyboard storyboard, EasingFunctionBase easingFunc, FrameworkElement view,
                                                 float newX, float newY, float newWidth, float newHeight, int duration)
        {
            var transform = view.RenderTransform as TranslateTransform;
            var currentX = Canvas.GetLeft(view);
            var currentY = Canvas.GetTop(view);

            if (HasChanged(currentX, newX))
            {
                storyboard.Children.Add(CreateTranslateTransformTimeline(view, currentX, newX, easingFunc,
                                                                         string.Format(RespositionTargetPropertyTypeNameFormat, "X"), duration));
            }

            if (HasChanged(currentY, newY))
            {
                storyboard.Children.Add(CreateTranslateTransformTimeline(view, currentY, newY, easingFunc,
                                                                         string.Format(RespositionTargetPropertyTypeNameFormat, "Y"), duration));
            }

            if (HasChanged(view.Width, newWidth))
            {
                var timelineWidth = CreateTranslateTransformTimeline(view, (int)Math.Round(view.ActualWidth), newWidth, easingFunc, "Width", duration);
                    timelineWidth.EnableDependentAnimation = true;
                storyboard.Children.Add(timelineWidth);
            }

            if (HasChanged(view.Height, newHeight))
            {
                var timelineHeight = CreateTranslateTransformTimeline(view, (int)Math.Round(view.ActualHeight), newHeight, easingFunc, "Height", duration);
                timelineHeight.EnableDependentAnimation = true;
                storyboard.Children.Add(timelineHeight);
            }
        }

        private static bool HasChanged(double currentValue, double newValue)
        {
            return currentValue != newValue;
        }

        private static DoubleAnimation CreateTranslateTransformTimeline(FrameworkElement view, double from, double to, EasingFunctionBase easingFunc,
                                                                        string targetPropertyName, int durationMS)
        {
            var timeline = new DoubleAnimation() { From = from, To = to, Duration = TimeSpan.FromMilliseconds(durationMS), EasingFunction = easingFunc };
            Storyboard.SetTarget(timeline, view);
            Storyboard.SetTargetProperty(timeline, targetPropertyName);

            return timeline;
        }
    }
}
