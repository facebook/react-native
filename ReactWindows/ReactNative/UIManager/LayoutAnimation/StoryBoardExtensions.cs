using System;
using System.Globalization;
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
        private const string TranslateXPropertyPath = "(UIElement.RenderTransform).(TransformGroup.Children)[0].(TranslateTransform.X)";
        private const string TranslateYPropertyPath = "(UIElement.RenderTransform).(TransformGroup.Children)[0].(TranslateTransform.Y)";
        private const string ScaleXPropertyPath = "(UIElement.RenderTransform).(TransformGroup.Children)[1].(ScaleTransform.ScaleX)";
        private const string ScaleYPropertyPath = "(UIElement.RenderTransform).(TransformGroup.Children)[1].(ScaleTransform.ScaleY)";

        /// <summary>
        /// Creates the opacity transitioning timeline for a alpha storyboard effect.
        /// </summary>
        /// <param name="storyboard">The storyboard to extend off.</param>
        /// <param name="easingFunc">The easing effect function to set as the animation projection.</param>
        /// <param name="view">The view that needs to be animated.</param>
        /// <param name="startingfactor">The starting point factor.</param>
        /// <param name="endFactor">The end point factor of the transition.</param>
        /// <param name="duration">The total play duration in milliseconds for the <see cref="Timeline"/>.</param>
        public static void SetOpacityTimeline(
            this Storyboard storyboard, 
            EasingFunctionBase easingFunc, 
            FrameworkElement view,
            float startingfactor, 
            float endFactor, 
            TimeSpan duration)
        {
            var timeline = new DoubleAnimation
            {
                EasingFunction = easingFunc,
                From = startingfactor,
                To = endFactor,
                Duration = duration,
            };

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
        public static void SetScalingTimeline(
            this Storyboard storyboard, 
            EasingFunctionBase easingFunc, 
            FrameworkElement view,
            float startingfactor, 
            float endFactor, 
            double speedRateRatio, 
            int duration)
        {
            var transformation = new ScaleTransform
            {
                ScaleX = 1,
                ScaleY = 1,
            };

            view.RenderTransform = transformation;
            view.RenderTransformOrigin = new Point(ScalingTransitionStartXPoint, ScalingTransitionStartYPoint);

            var timelineY = new DoubleAnimation
            {
                From = startingfactor,
                To = endFactor,
                EasingFunction = easingFunc,
                Duration = TimeSpan.FromMilliseconds(duration),
                SpeedRatio = speedRateRatio
            };

            var timelineX = new DoubleAnimation
            {
                From = startingfactor,
                To = endFactor,
                EasingFunction = easingFunc,
                Duration = TimeSpan.FromMilliseconds(duration),
                SpeedRatio = speedRateRatio
            };

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
        public static void SetRepositionTimelines(
            this Storyboard storyboard, 
            EasingFunctionBase easingFunc, 
            FrameworkElement view,
            float newX,
            float newY,
            float newWidth,
            float newHeight,
            TimeSpan duration)
        {
            var transform = view.RenderTransform as TranslateTransform;
            var currentX = Canvas.GetLeft(view);
            var currentY = Canvas.GetTop(view);
            var currentWidth = view.Width;
            var currentHeight = view.Height;

            if (currentX != newX)
            {
                view.SetValue(Canvas.LeftProperty, newX);
                var offset = currentX - newX;
                storyboard.Children.Add(
                    CreateDoubleAnimation(
                        view, offset, 0, easingFunc, TranslateXPropertyPath, duration));
            }

            if (currentY != newY)
            {
                view.SetValue(Canvas.TopProperty, newY);
                var offset = currentY - newY;
                storyboard.Children.Add(
                    CreateDoubleAnimation(
                        view, offset, 0, easingFunc, TranslateYPropertyPath, duration));
            }

            if (currentWidth != newWidth)
            {
                view.Width = newWidth;
                var factor = currentWidth / newWidth;
                storyboard.Children.Add(
                    CreateDoubleAnimation(
                        view, factor, 1.0, easingFunc, ScaleXPropertyPath, duration));
            }

            if (view.Height != newHeight)
            {
                view.Height = newHeight;
                var factor = currentHeight / newHeight;
                storyboard.Children.Add(
                    CreateDoubleAnimation(
                        view, factor, 1.0, easingFunc, ScaleYPropertyPath, duration));
            }
        }

        private static bool HasChanged(double currentValue, double newValue)
        {
            return currentValue != newValue;
        }

        private static DoubleAnimation CreateDoubleAnimation(
            FrameworkElement view,
            double from, 
            double to,
            EasingFunctionBase easingFunc,
            string targetPropertyName,
            TimeSpan duration)
        {
            var timeline = new DoubleAnimation
            {
                From = from,
                To = to,
                Duration = duration,
                EasingFunction = easingFunc,
            };

            Storyboard.SetTarget(timeline, view);
            Storyboard.SetTargetProperty(timeline, targetPropertyName);
            timeline.EnableDependentAnimation = false;

            return timeline;
        }
    }
}
