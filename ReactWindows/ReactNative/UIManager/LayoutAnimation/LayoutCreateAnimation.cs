using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Base Layout animation manager responsible for establishing the basic animation <see cref="Storyboard"/>.
    /// </summary>
    class LayoutCreateAnimation : StoryboardAnimation
    {
        /// <summary>
        /// The animation creation implementation for the next animation layout configuration cycle.
        /// </summary>
        /// <param name="view">The native <see cref="FrameworkElement"/> component.</param>
        /// <param name="x">The X coordinate.</param>
        /// <param name="y">The new Y coordinate.</param>
        /// <param name="width">The new width for <see cref="FrameworkElement"/>.</param>
        /// <param name="height">The new height for the <see cref="FrameworkElement"/>.</param>
        /// <returns></returns>
        public override Storyboard CreateAnimationImpl(FrameworkElement view, int x, int y, int width, int height)
        {
            var animation = default(Storyboard);

            if (base.PropertyType != AnimatedPropertyType.None)
            {
                animation = new Storyboard();
                float fromValue = 0, toValue = 1;

                if (base.PropertyType == AnimatedPropertyType.Opacity)
                {
                    animation.SetOpacityTimeline(base.Type.EasingFunction(), view, fromValue, toValue, base.DurationMS);
                }
                else if (base.PropertyType == AnimatedPropertyType.ScaleXY)
                {
                    view.RenderTransform = new TranslateTransform();
                    animation.SetRepositionTimelines(base.Type.EasingFunction(), view, x, y, width, height, base.DurationMS);
                    //animation.SetScalingTimeline(base.EasingFunction, view, fromValue, toValue, speedRatio, base.DurationMS);
                }
            }
            else
            {
                return null;
            }

            return animation;
        }

        /// <summary>
        /// Indicates if the animation frame is valid for rendering.
        /// </summary>
        /// <returns></returns>
        public override bool IsValid()
        {
            return base.DurationMS > 0;
        }
    }
}
