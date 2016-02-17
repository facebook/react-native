using Newtonsoft.Json.Linq;
using System;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    static class InterpolationTypeExtensions
    {
        private static readonly BackEase s_easeIn = new BackEase
        {
            EasingMode = EasingMode.EaseIn,
            Amplitude = 0.5
        };

        private static readonly BackEase s_easeOut = new BackEase
        {
            EasingMode = EasingMode.EaseOut,
            Amplitude = 0.5
        };

        private static readonly BackEase s_easeInOut = new BackEase
        {
            EasingMode = EasingMode.EaseInOut,
            Amplitude = 0.5
        };

        public static EasingFunctionBase GetEasingFunction(this InterpolationType interpolationType, JObject data)
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
                case InterpolationType.Linear:
                    return null;
                case InterpolationType.Spring:
                default:
                    throw new NotImplementedException();
            }
        }
    }
}
