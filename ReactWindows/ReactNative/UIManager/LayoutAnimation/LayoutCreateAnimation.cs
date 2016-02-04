using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Base Layout animation manager responsible for establishing the basic animation <see cref="Storyboard"/>.
    /// </summary>
    class LayoutCreateAnimation : StoryboardAnimation
    {
        public LayoutCreateAnimation() : base()
        {
        }

        public override Storyboard CreateAnimationImpl(FrameworkElement view, int x, int y, int width, int height)
        {
            var animation = default(Storyboard);

            if (base.PropertyType != AnimatedPropertyType.None)
            {
                animation = new Storyboard();
                float fromValue = 0, toValue = 1;

                if (base.PropertyType == AnimatedPropertyType.opacity)
                {
                    animation.SetOpacityTimeline(base.EasingFunction, view, fromValue, toValue, base.DurationMS);
                }
                else if (base.PropertyType == AnimatedPropertyType.scaleXY)
                {
                    float speedRatio = .5f;
                    animation.SetScalingTimeline(base.EasingFunction, view, fromValue, toValue, speedRatio, base.DurationMS);
                }
            }

            return animation;
        }

        public override bool IsValid()
        {
            return base.DurationMS > 0;
        }
    }
}
