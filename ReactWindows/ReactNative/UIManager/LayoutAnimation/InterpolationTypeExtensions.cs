using Newtonsoft.Json.Linq;
using System;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    static class InterpolationTypeExtensions
    {
        private static readonly QuadraticEase s_easeIn = new QuadraticEase
        {
            EasingMode = EasingMode.EaseIn,
        };

        private static readonly QuadraticEase s_easeOut = new QuadraticEase
        {
            EasingMode = EasingMode.EaseOut,
        };

        private static readonly QuadraticEase s_easeInOut = new QuadraticEase
        {
            EasingMode = EasingMode.EaseInOut,
        };

        /// <remarks>
        /// We're currently using bounce ease because of an exception thrown by
        /// XAML if the width or height property shrinks below zero.
        /// TODO: implement proper spring interpolation function.
        /// </remarks>
        private static readonly BounceEase s_spring = new BounceEase();

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
                case InterpolationType.Spring:
                    return s_spring;
                case InterpolationType.Linear:
                    return null;
                default:
                    throw new NotImplementedException();
            }
        }
    }
}
