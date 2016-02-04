using Newtonsoft.Json.Linq;
using ReactNative.Views.Image;
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
    /// Base class responsible for parsing the animation JSON config and creating an <see cref="Storyboard"/> animation. 
    /// </summary>
    public abstract class StoryboardAnimation
    {
        protected StoryboardAnimation()
        {
            this.Reset();
        }

        private const string CONFIG_PROPERTY = "property";
        private const string CONFIG_DURATION = "duration";
        private const string CONFIG_DELAY = "delay";
        private const string CONFIG_TYPE = "type";

        public abstract bool IsValid();
        
        public abstract Storyboard CreateAnimationImpl(FrameworkElement view, int x, int y, int width, int height);

        protected AnimatedPropertyType PropertyType { private set; get; }

        protected int DurationMS { private set; get; }

        protected int DelayMS { private set; get; }

        protected InterpolationType Type { private set; get; }

        protected EasingFunctionBase EasingFunction
        {
            get {
                var transitionFunction = default(EasingFunctionBase);

                if(EasingFunctions.TryGetValue(Type, out transitionFunction))
                {
                    return transitionFunction;
                }
                else
                {
                    return null;
                }
            }
        }

        protected IReadOnlyDictionary<InterpolationType, EasingFunctionBase> EasingFunctions
        {
            get
            {
                return new Dictionary<InterpolationType, EasingFunctionBase>() {
                    { InterpolationType.easeIn, new BackEase() { EasingMode = EasingMode.EaseIn, Amplitude = .5 } },
                    { InterpolationType.easeOut, new BackEase() { EasingMode = EasingMode.EaseOut, Amplitude = .5} },
                    { InterpolationType.easeInEaseOut, new BackEase() { EasingMode = EasingMode.EaseInOut, Amplitude = .5} },
                    { InterpolationType.linear, null },
                    { InterpolationType.spring, new ElasticEase() { Oscillations = 3, Springiness = 1 } }
                };
            }
        }
        
        /// <summary>
        /// Initliazes all the member properties based on the style config of the animation.
        /// </summary>
        /// <param name="config">The style config.</param>
        public void InitializeFromConfig(JObject config, int globalDuration)
        {
            var propertyType = default(AnimatedPropertyType);
            var interpolationType = default(InterpolationType);
            var duration = default(JToken);
            var token = default(JToken);
            var delay = default(JToken);
            var type = default(JToken);

            if (config.TryGetValue(CONFIG_PROPERTY, out token) && 
                Enum.TryParse(token.ToObject<string>(), out propertyType))
            {
                PropertyType = propertyType;
            }
            else
            {
                PropertyType = AnimatedPropertyType.None;
            }

            if (config.TryGetValue(CONFIG_TYPE, out type) &&
                Enum.TryParse(type.ToObject<string>(), out interpolationType))
            {
                Type = interpolationType;
            }
            else
            {
                Type = InterpolationType.None;
            }

            DurationMS = config.TryGetValue(CONFIG_DURATION, out duration) ? duration.ToObject<int>() : globalDuration;
            DelayMS = config.TryGetValue(CONFIG_DELAY, out delay) ? delay.ToObject<int>() : 0;

            if (!IsValid())
            {
                throw new InvalidOperationException("Invalid layout animation : ");
            }
        }

        /// <summary>
        /// Creates the <see cref="Storyboard"/> animation.
        /// </summary>
        /// <param name="view"></param>
        /// <param name="x"></param>
        /// <param name="y"></param>
        /// <param name="width"></param>
        /// <param name="height"></param>
        /// <returns></returns>
        public Storyboard CreateAnimation(FrameworkElement view, int x, int y, int width, int height)
        {
            if (!IsValid())
            {
                return null;
            }

            var storyboard = CreateAnimationImpl(view, x, y, width, height);
            storyboard.Duration = TimeSpan.FromMilliseconds(DurationMS);
            storyboard.BeginTime = TimeSpan.FromMilliseconds(DelayMS);

            return storyboard;
        }

        /// <summary>
        /// Resets the view to it's default settings.
        /// </summary>
        public void Reset()
        {
            PropertyType = AnimatedPropertyType.None;
            Type = InterpolationType.None;
            DurationMS = 0;
            DelayMS = 0;
        }
        
    }
}
