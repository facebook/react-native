using ReactNative.Bridge;
using System.Collections.Generic;

namespace ReactNative.Animation
{
    /// <summary>
    /// Coordinates catalyst animations driven by <see cref="UIManagerModule"/>.
    /// </summary>
    public class AnimationRegistry
    {
        private readonly IDictionary<int, AnimationManager> _AnimationRegistry;

        public AnimationRegistry() { }

        public AnimationRegistry(AnimationManager animation)
        {
            DispatcherHelpers.AssertOnDispatcher();

            _AnimationRegistry = new Dictionary<int, AnimationManager>() {
                { animation.AnimationId, animation}
            };
        }

        public AnimationManager getAnimation(int animationID)
        {
            DispatcherHelpers.AssertOnDispatcher();

            return _AnimationRegistry[animationID];
        }

        public AnimationManager removeAnimation(int animationID)
        {
            DispatcherHelpers.AssertOnDispatcher();

            var animation = default(AnimationManager);

            if (_AnimationRegistry.TryGetValue(animationID, out animation))
            {
                _AnimationRegistry.Remove(animationID);
            }

            return animation;
        }
    }
}