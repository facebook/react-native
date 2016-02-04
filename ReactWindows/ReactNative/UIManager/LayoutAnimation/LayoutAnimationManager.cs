using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Class responsible for animation layout changes.
    /// </summary>
    public class LayoutAnimationManager
    {
        private const string CONFIG_PROP_DURATION = "duration";
        private const string CONFIG_PROP_ACTION_CREATE = "create";
        private const string CONFIG_PROP_ACTION_UPDATE = "update";
        private Dictionary<string, StoryboardAnimation> _AnimationLayoutDictionary;
        private bool _ShouldAnimateLayout;

        /// <summary>
        /// Setup the initial settings of the initial and follow-on <see cref="Storyboard"/>(s).
        /// </summary>
        /// <param name="config">The JSON config of the animation.</param>
        public void InitializeFromConfig(JObject config)
        {
            var durationToken = default(JToken);
            var actionTypeCreateToken = default(JToken);
            var actionTypeUpdateToken = default(JToken);
            var globalDuration = default(int);

            _AnimationLayoutDictionary = new Dictionary<string, StoryboardAnimation>()
            {
                { CONFIG_PROP_ACTION_CREATE, new LayoutCreateAnimation() },
                { CONFIG_PROP_ACTION_UPDATE, new LayoutUpdateAnimation() },
            };

            if (config == null)
            {
                Reset();
                return;
            }

            _ShouldAnimateLayout = false;
            globalDuration = config.TryGetValue(CONFIG_PROP_DURATION, out durationToken) ? durationToken.ToObject<int>() : 0;

            if (config.TryGetValue(CONFIG_PROP_ACTION_CREATE, out actionTypeCreateToken))
            {
                _AnimationLayoutDictionary[CONFIG_PROP_ACTION_CREATE].InitializeFromConfig(actionTypeCreateToken.ToObject<JObject>(), globalDuration);
                _ShouldAnimateLayout = true;
            }

            if (config.TryGetValue(CONFIG_PROP_ACTION_UPDATE, out actionTypeUpdateToken))
            {
                _AnimationLayoutDictionary[CONFIG_PROP_ACTION_UPDATE].InitializeFromConfig(actionTypeUpdateToken.ToObject<JObject>(), globalDuration);
                _ShouldAnimateLayout = true;
            }
        }

        /// <summary>
        /// Determines if <see cref="FrameworkElement"/> should apply the animation <see cref="StoryBoard"/>.
        /// </summary>
        /// <param name="view">The view to animate.</param>
        /// <returns></returns>
        public bool ShouldAnimateLayout(FrameworkElement view) { return _ShouldAnimateLayout && view.Parent != null; }

        public void Reset()
        {
            _AnimationLayoutDictionary[CONFIG_PROP_ACTION_CREATE].Reset();
            _AnimationLayoutDictionary[CONFIG_PROP_ACTION_UPDATE].Reset();
            _ShouldAnimateLayout = false;
        }

        /// <summary>
        /// Create the animation <see cref="Storyboard"/> and kick off the binded <see cref="Timeline"/>(s). 
        /// </summary>
        /// <param name="view">The native view to animate.</param>
        /// <param name="x">The new X position to animate to.</param>
        /// <param name="y">The new Y position to animate to.</param>
        /// <param name="width">The new width that the <see cref="FrameworkElement"/> needs to transform to.</param>
        /// <param name="height">The new height that the <see cref="FrameworkElement"/> needs to transform to.</param>
        public void ApplyLayoutUpdate(FrameworkElement view, int x, int y, int width, int height)
        {
            DispatcherHelpers.AssertOnDispatcher();

            var animation = view.Width == 0 || view.Height == 0 ? _AnimationLayoutDictionary[CONFIG_PROP_ACTION_CREATE] 
                : _AnimationLayoutDictionary[CONFIG_PROP_ACTION_UPDATE];

            var storyboard = animation.CreateAnimation(view, x, y, width, height);

            if(storyboard != null)
            {
                storyboard.Begin();
            }
        }
    }
}
