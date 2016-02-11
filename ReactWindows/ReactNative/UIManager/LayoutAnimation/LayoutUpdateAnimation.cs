using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Defines which <see cref="Storyboard"/> should be used for animating
    /// layout updates for <see cref="FrameworkElement"/>.
    /// </summary>
    class LayoutUpdateAnimation : StoryboardAnimation
    {
        protected override bool IsValid
        {
            get
            {
                return DurationMS > 0;
            }
        }

        public override Storyboard CreateAnimationImpl(FrameworkElement view, int x, int y, int width, int height)
        {
            var animation = default(Storyboard);
            var transform = view.RenderTransform as TranslateTransform;
            var animateLocation = (GetYDistance(transform) != y || GetXDistance(transform) != x);
            var animateSize = (view.Height != height || view.Width != width);

            if (animateLocation || animateLocation)
            {
                animation = new Storyboard();
                view.RenderTransform = new TranslateTransform();
                animation.SetRepositionTimelines(base.Type.EasingFunction(), view, x, y, width, height, base.DurationMS);
            }

            return animation;
        }

        private double GetXDistance(TranslateTransform transform)
        {
            return transform != null ? transform.X : 0;
        }

        private double GetYDistance(TranslateTransform transform)
        {
            return transform != null ? transform.Y : 0;
        }
    }
}
