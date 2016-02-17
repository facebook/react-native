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
            var currentX = Canvas.GetLeft(view);
            var currentY = Canvas.GetTop(view);
            var currentWidth = view.Width;
            var currentHeight = view.Height;

            if (x != currentX || y != currentY || width != currentWidth || height != currentHeight)
            {
                var animation = new Storyboard();
                view.RenderTransform = new TranslateTransform();
                animation.SetRepositionTimelines(Type.AsEasingFunction(), view, x, y, width, height, DurationMS);
                return animation;
            }

            return null;
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
