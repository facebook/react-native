using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    public class LayoutUpdateAnimation : StoryboardAnimation
    {
        public LayoutUpdateAnimation() : base()
        {
        }

        private double GetXDistance(TranslateTransform transform)
        {
            return transform != null ? transform.X : 0;
        }

        private double GetYDistance(TranslateTransform transform)
        {
            return transform!=null  ? transform.Y : 0;
        }

        public override Storyboard CreateAnimationImpl(FrameworkElement view, int x, int y, int width, int height)
        {
            var animation = default(Storyboard);
            var transform = view.RenderTransform as TranslateTransform;
            var animateLocation = (GetYDistance(transform) != y || GetXDistance(transform) != x);
            var animateSize = (view.Height != height || view.Width != width);

            if (!animateLocation && !animateLocation)
            {
                return null;
            }
            else
            {
                animation = new Storyboard();
                view.RenderTransform = new TranslateTransform();
                animation.SetRepositionTimelines(base.EasingFunction, view, x, y, width, height, base.DurationMS);
            }

            return animation;
        }

        public override bool IsValid()
        {
            return base.DurationMS > 0;
        }
    }
}
