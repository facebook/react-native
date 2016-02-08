using ReactNative.Bridge;
using System.Collections.Generic;

namespace ReactNative.Animation
{
    /// <summary>
    /// Coordinates catalyst animations driven by <see cref="UIManagerModule"/>.
    /// </summary>
    public class AnimationRegistry
    {
        private readonly IDictionary<int, AnimationManager> _animationRegistry;

        public AnimationRegistry() { }

        public AnimationRegistry(AnimationManager animation)
        {
            DispatcherHelpers.AssertOnDispatcher();

            _animationRegistry = new Dictionary<int, AnimationManager>() {
                { animation.AnimationId, animation}
            };
        }

        public AnimationManager GetAnimation(int animationID)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var animation = default(AnimationManager);
            
            if (_animationRegistry.TryGetValue(animationID, out animation))
            {
                return animation;
            }
            else
            {
                return null;
            }
        }

        public void RegisterAnimation(AnimationManager animation)
        {
            DispatcherHelpers.AssertOnDispatcher();

            _animationRegistry[animation.AnimationId] = animation;
        }

        public AnimationManager RemoveAnimation(int animationID)
        {
            DispatcherHelpers.AssertOnDispatcher();

            var animation = default(AnimationManager);

            if (_animationRegistry.TryGetValue(animationID, out animation))
            {
                _animationRegistry.Remove(animationID);
            }

            return animation;
        }
    }
}