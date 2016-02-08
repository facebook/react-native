using Newtonsoft.Json.Linq;
using ReactNative.Reflection;
using ReactNative.Views.Image;
using System;
using System.Collections.Generic;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Base class responsible for parsing the animation JSON config and creating a <see cref="Storyboard"/> animation. 
    /// </summary>
    public abstract class StoryboardAnimation
    {
        private const string CONFIG_PROPERTY = "property";
        private const string CONFIG_DURATION = "duration";
        private const string CONFIG_DELAY = "delay";
        private const string CONFIG_TYPE = "type";
        private const string CONFIG_SPRING_INTENSITY = "springDamping";

        public abstract bool IsValid();
        
        public abstract Storyboard CreateAnimationImpl(FrameworkElement view, int x, int y, int width, int height);

        public AnimatedPropertyType PropertyType { private set; get; }

        /// <summary>
        /// Sets/Gets the <see cref="SpringIntensity"/> of the <see cref="EasingFunction"/>. 
        /// </summary>
        public int SpringIntensity { private set; get; }

        /// <summary>
        /// Sets the duration of the animation.
        /// </summary>
        protected int DurationMS { private set; get; }

        /// <summary>
        /// Sets the delay of the start of the animation.
        /// </summary>
        protected int DelayMS { private set; get; }

        /// <summary>
        /// The <see cref="InterpolationType"/> of the animation.
        /// </summary>
        protected InterpolationType Type { private set; get; }
        
        /// <summary>
        /// Initliazes all the member properties based on the style config of the animation.
        /// </summary>
        /// <param name="config">The style config.</param>
        public void InitializeFromConfig(JObject config, int globalDuration)
        {
            var duration = default(JToken);
            var token = default(JToken);
            var delay = default(JToken);
            var type = default(JToken);
            var springDamping = default(JToken);

            if (config.TryGetValue(CONFIG_PROPERTY, out token))
            {
                PropertyType = EnumHelpers.Parse<AnimatedPropertyType>(token.ToObject<string>());
            }
            else
            {
                PropertyType = AnimatedPropertyType.None;
            }

            if (config.TryGetValue(CONFIG_SPRING_INTENSITY, out springDamping))
            {
                //The Springiness property of the Elastic easing function works with only absolute int values
                //iOS and Android use floating point numbers. 
                SpringIntensity = (int)springDamping.ToObject<float>() * 10;
            }
            else
            {
                SpringIntensity = 4;
            }

            ((ElasticEase)InterpolationType.Spring.EasingFunction()).Springiness = SpringIntensity;

            if (config.TryGetValue(CONFIG_TYPE, out type))
            {
                Type = EnumHelpers.Parse<InterpolationType>(type.ToObject<string>());
            }
            else
            {
                Type = InterpolationType.None;
            }

            DurationMS = config.TryGetValue(CONFIG_DURATION, out duration) ? duration.ToObject<int>() : globalDuration;
            DelayMS = config.TryGetValue(CONFIG_DELAY, out delay) ? delay.ToObject<int>() : 0;

            if (!IsValid())
            {
                throw new InvalidOperationException(string.Format("Invalid layout animation exception. Likely due to duration of {0} not being set", DurationMS));
            }
        }

        /// <summary>
        /// Creates the <see cref="Storyboard"/> animation.
        /// </summary>
        /// <param name="view">The <see cref="FrameworkElement"/> view.</param>
        /// <param name="x">The X coordinate.</param>
        /// <param name="y">The new Y coordinate.</param>
        /// <param name="width">The new width for <see cref="FrameworkElement"/>.</param>
        /// <param name="height">The new height for the <see cref="FrameworkElement"/>.</param>
        /// <returns></returns>
        public Storyboard CreateAnimation(FrameworkElement view, int x, int y, int width, int height)
        {
            if (!IsValid())
            {
                return null;
            }

            var storyboard = CreateAnimationImpl(view, x, y, width, height);

            if (storyboard != null)
            {
                storyboard.Duration = TimeSpan.FromMilliseconds(DurationMS);
                storyboard.BeginTime = TimeSpan.FromMilliseconds(DelayMS);
            }

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
