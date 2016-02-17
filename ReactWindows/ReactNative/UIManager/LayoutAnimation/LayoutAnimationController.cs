using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Class responsible for animation layout changes, if a valid animation
    /// configuration has been supplied. If animation is not available, the
    /// layout change is applied immediately instead of animating.
    /// </summary>
    /// <remarks>
    /// TODO: Invoke success callback at the end of the animation.
    /// </remarks>
    public class LayoutAnimationController
    {
        private readonly LayoutAnimation _layoutCreateAnimation = new LayoutCreateAnimation();
        private readonly LayoutAnimation _layoutUpdateAnimation = new LayoutUpdateAnimation();

        private bool _shouldAnimateLayout;

        /// <summary>
        /// Initializes the layout animation.
        /// </summary>
        /// <param name="config">The configuration.</param>
        public void InitializeFromConfig(JObject config)
        {
#if !LAYOUT_ANIMATION_DISABLED
            if (config == null)
            {
                Reset();
                return;
            }

            _shouldAnimateLayout = false;
            var globalDuration = config.Value<int>("duration");
            var createData = config.Value<JObject>("create");
            if (createData != null)
            {
                _layoutCreateAnimation.InitializeFromConfig(createData, globalDuration);
                _shouldAnimateLayout = true;
            }

            var updateData = config.Value<JObject>("update");
            if (updateData != null)
            {
                _layoutUpdateAnimation.InitializeFromConfig(updateData, globalDuration);
                _shouldAnimateLayout = true;
            }
#else
            return;
#endif
        }

        /// <summary>
        /// Determines if <see cref="FrameworkElement"/> should apply layout animation.
        /// </summary>
        /// <param name="view">The view to animate.</param>
        /// <returns>
        /// <code>true</code> if the layout operation should be animated, 
        /// otherwise <code>false</code>.
        /// </returns>
        public bool ShouldAnimateLayout(FrameworkElement view)
        {
            return _shouldAnimateLayout && view.Parent != null;
        }

        /// <summary>
        /// Create the animation <see cref="GetAnimator"/> and kick off the binded <see cref="Timeline"/>(s). 
        /// </summary>
        /// <param name="view">The native view to animate.</param>
        /// <param name="x">The new X position to animate to.</param>
        /// <param name="y">The new Y position to animate to.</param>
        /// <param name="width">The new width that the <see cref="FrameworkElement"/> needs to transform to.</param>
        /// <param name="height">The new height that the <see cref="FrameworkElement"/> needs to transform to.</param>
        public void ApplyLayoutUpdate(FrameworkElement view, int x, int y, int width, int height)
        {
            DispatcherHelpers.AssertOnDispatcher();

            var layoutAnimation = view.ActualWidth == 0 || view.ActualHeight == 0
                ? _layoutCreateAnimation
                : _layoutUpdateAnimation;

            var animation = layoutAnimation.CreateAnimation(view, x, y, width, height);
            if (animation == null)
            {
                Canvas.SetLeft(view, x);
                Canvas.SetTop(view, y);
                view.Width = width;
                view.Height = height;
            }
            else
            {
                animation.Begin();
            }
        }

        /// <summary>
        /// Reset the animation manager.
        /// </summary>
        public void Reset()
        {
            _layoutCreateAnimation.Reset();
            _layoutUpdateAnimation.Reset();
            _shouldAnimateLayout = false;
        }
    }
}