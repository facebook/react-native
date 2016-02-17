using System;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    static class InterpolationTypeExtensions
    {
        private static readonly EasingFunctionBase s_easeIn = new BackEase
        {
            EasingMode = EasingMode.EaseIn,
            Amplitude = 0.5
        };

        private static readonly EasingFunctionBase s_easeOut = new BackEase
        {
            EasingMode = EasingMode.EaseOut,
            Amplitude = 0.5
        };

        private static readonly EasingFunctionBase s_easeInOut = new BackEase
        {
            EasingMode = EasingMode.EaseInOut,
            Amplitude = 0.5
        };

        private static readonly EasingFunctionBase s_spring = new ElasticEase { Oscillations = 3 };

        public static EasingFunctionBase AsEasingFunction(this InterpolationType interpolationType)
        {
            var storyboard = new Storyboard();

            switch (interpolationType)
            {
                case InterpolationType.EaseIn:
                    return s_easeIn;
                case InterpolationType.EaseOut:
                    return s_easeOut;
                case InterpolationType.EaseInEaseOut:
                    return s_easeInOut;
                case InterpolationType.Spring:
                    return s_spring;
                case InterpolationType.Linear:
                case InterpolationType.None:
                    return null;
                default:
                    throw new NotImplementedException();
            }
        }
    }
}
