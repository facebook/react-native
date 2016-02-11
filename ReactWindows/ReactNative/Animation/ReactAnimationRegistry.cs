using ReactNative.Bridge;
using System.Collections.Generic;

namespace ReactNative.Animation
{
    /// <summary>
    /// Coordinates animations driven by the <see cref="UIManager.UIManagerModule"/>.
    /// </summary>
    public class ReactAnimationRegistry
    {
        private readonly IDictionary<int, ReactAnimation> _registry =
            new Dictionary<int, ReactAnimation>();

        /// <summary>
        /// Registers an animation.
        /// </summary>
        /// <param name="animation">The animation.</param>
        public void RegisterAnimation(ReactAnimation animation)
        {
            DispatcherHelpers.AssertOnDispatcher();
            _registry.Add(animation.AnimationId, animation);
        }

        /// <summary>
        /// Gets the animation with the given identifier.
        /// </summary>
        /// <param name="animationId">The animation identifier.</param>
        /// <returns>The animation with the given identifier.</returns>
        public ReactAnimation GetAnimation(int animationId)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var result = default(ReactAnimation);
            if (_registry.TryGetValue(animationId, out result))
            {
                return result;
            }

            return null;
        }

        /// <summary>
        /// Removes the animation with the given identifier.
        /// </summary>
        /// <param name="animationId">The animation identifier.</param>
        /// <returns>The animation with the given identifier.</returns>
        public ReactAnimation RemoveAnimation(int animationId)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var animation = GetAnimation(animationId);
            if (animation != null)
            {
                _registry.Remove(animationId);
            }

            return animation;
        }
    }
}