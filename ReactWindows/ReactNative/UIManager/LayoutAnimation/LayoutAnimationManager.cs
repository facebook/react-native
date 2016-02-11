using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using Windows.UI.Xaml;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Class responsible for animation layout changes.
    /// </summary>
    public class LayoutAnimationManager
    {
        private readonly StoryboardAnimation _layoutCreateAnimation = new LayoutCreateAnimation();
        private readonly StoryboardAnimation _layoutUpdateAnimation = new LayoutUpdateAnimation();

        private bool _shouldAnimateLayout;

        /// <summary>
        /// Setup the initial settings of the initial and follow-on <see cref="GetAnimator"/>(s).
        /// </summary>
        /// <param name="config">The JSON config of the animation.</param>
        public void InitializeFromConfig(JObject config)
        {
            var durationToken = default(JToken);
            var actionTypeCreateToken = default(JToken);
            var actionTypeUpdateToken = default(JToken);
            var globalDuration = default(int);

            if (config == null)
            {
                Reset();
                return;
            }

            _shouldAnimateLayout = false;
            globalDuration = config.TryGetValue("duration", out durationToken) ? durationToken.Value<int>() : 0;

            if (config.TryGetValue("create", out actionTypeCreateToken))
            {
                GetAnimator(LayoutAnimationType.Create)
                    .InitializeFromConfig(
                        actionTypeCreateToken.Value<JObject>(), 
                        globalDuration);
                _shouldAnimateLayout = true;
            }

            if (config.TryGetValue("update", out actionTypeUpdateToken))
            {
                GetAnimator(LayoutAnimationType.Update)
                    .InitializeFromConfig(
                        actionTypeUpdateToken.ToObject<JObject>(), globalDuration);
                _shouldAnimateLayout = true;
            }
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

            var animationState = view.ActualWidth == 0 || view.ActualHeight == 0 
                ? LayoutAnimationType.Create 
                : LayoutAnimationType.Update;

            GetAnimator(animationState)
                .CreateAnimation(view, x, y, width, height)?
                .Begin();
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

        /// <summary>
        /// Returns the <see cref="StoryboardAnimation"/> to animate based on the <see cref="LayoutAnimationType"/>. Currently there is one for animating the initial state
        /// of a <see cref="FrameworkElement"/> and another for updating the layout change(i.e. update). 
        /// </summary>
        /// <param name="animationState">The desired <see cref="LayoutAnimationType"/>.</param>
        /// <returns>Thre <see cref="StoryboardAnimation"/> reference.</returns>
        private StoryboardAnimation GetAnimator(LayoutAnimationType animationState)
        {
            switch (animationState)
            {
                case LayoutAnimationType.Create:
                    return _layoutCreateAnimation;
                case LayoutAnimationType.Update:
                    return _layoutUpdateAnimation;
                default:
                    throw new NotImplementedException();
            }
        }
    }
}