using ReactNative.Views.Image;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    static class InterpolationTypesExtensions
    {
        private static IReadOnlyDictionary<InterpolationType, EasingFunctionBase> EasingFunctions
        {
            get
            {
                return new Dictionary<InterpolationType, EasingFunctionBase>() {
                    { InterpolationType.EaseIn, new BackEase() { EasingMode = EasingMode.EaseIn, Amplitude = .5 } },
                    { InterpolationType.EaseOut, new BackEase() { EasingMode = EasingMode.EaseOut, Amplitude = .5} },
                    { InterpolationType.EaseInEaseOut, new BackEase() { EasingMode = EasingMode.EaseInOut, Amplitude = .5} },
                    { InterpolationType.Linear, null },
                    { InterpolationType.Spring, new ElasticEase() { Oscillations = 3 } }
                };
            }
        }

        /// <summary>
        /// Determines the <see cref="EasingFunctionBase"/> of the <see cref="Storyboard"/>.
        /// </summary>
        public static EasingFunctionBase EasingFunction(this InterpolationType typeInstance)
        {
            var transitionFunction = default(EasingFunctionBase);

            if (EasingFunctions.TryGetValue(typeInstance, out transitionFunction))
            {
                 return transitionFunction;
            }
            else
            {
                return null;
            }
        }
    }
}
