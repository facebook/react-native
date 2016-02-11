using ReactNative.Animation.Events;
using System;
using Windows.UI.Xaml;

namespace ReactNative.Animation
{
    /// <summary>
    /// Base class for various animation engines. Subclasses should implement
    /// <see cref="Run"/>, which should bootstrap the animation. Then in each
    /// animation frame, we expect the animation engine to call 
    /// <see cref="OnUpdate(double)"/> with a float progress which then will be
    /// transferred to the underlying <see cref="IAnimationPropertyUpdater"/>
    /// instance.
    /// 
    /// The animation engine should support animation cancellation by
    /// monitoring the returned value of <see cref="OnUpdate(double)"/>. In
    /// case the result is <code>false</code>, the animation should be
    /// cancelled and the engine should not attempt to call 
    /// <see cref="OnUpdate(double)"/> again.
    /// </summary>
    public abstract class ReactAnimation
    {
        private readonly int _animationId;
        private readonly IAnimationPropertyUpdater _propertyUpdater;

        private bool _cancelled;
        private bool _isFinished;
        private FrameworkElement _animatedView;

        /// <summary>
        /// Instantiates the <see cref="ReactAnimation"/>.
        /// </summary>
        /// <param name="animationId">The animation identifier.</param>
        /// <param name="propertyUpdater">The property updater.</param>
        protected ReactAnimation(int animationId, IAnimationPropertyUpdater propertyUpdater)
        {
            _animationId = animationId;
            _propertyUpdater = propertyUpdater;
        }

        /// <summary>
        /// An event triggered when the animation is cancelled.
        /// </summary>
        public event EventHandler<AnimationCancelledEventArgs> AnimationCancelled;

        /// <summary>
        /// An event triggered when the animation completes.
        /// </summary>
        public event EventHandler<AnimationFinishedEventArgs> AnimationFinished;

        /// <summary>
        /// The animation identifier.
        /// </summary>
        public int AnimationId { get; }

        /// <summary>
        /// Start the animation on the given framework element.
        /// </summary>
        /// <param name="view">The view to animate.</param>
        public void Start(FrameworkElement view)
        {
            _animatedView = view;
            _propertyUpdater.Prepare(view);
            Run();
        }

        /// <summary>
        /// Cancels the animation.
        /// </summary>
        /// <remarks>
        /// Cancellation after the animation is finished is handled gracefully.
        /// </remarks>
        public void Cancel()
        {
            if (_isFinished || _cancelled)
            {
                return;
            }

            _cancelled = true;

            var animationCancelled = AnimationCancelled;
            if (animationCancelled != null)
            {
                animationCancelled(this, new AnimationCancelledEventArgs());
            }
        }

        /// <summary>
        /// The method to bootstrap the animation.
        /// </summary>
        protected abstract void Run();

        /// <summary>
        /// The animation engine should call this method for each animation
        /// frame, passing animation progress as a parameter. Animation
        /// progress should be within the range from 0 to 1.
        /// </summary>
        /// <param name="value">The progress value.</param>
        /// <returns>
        /// <code>false</code> if the animation has been cancelled, in which
        /// case the engine should not call this method again; otherwise,
        /// <code>true</code>.
        /// </returns>
        protected bool OnUpdate(double value)
        {
            AssertNotFinished();

            if (!_cancelled)
            {
                var animatedView = _animatedView;
                if (animatedView == null)
                {
                    throw new InvalidOperationException("Animated view must not be null.");
                }

                _propertyUpdater.OnUpdate(animatedView, value);
            }

            return !_cancelled;
        }

        /// <summary>
        /// Animation engine should call this method when the animation is
        /// finished. Should be called only once.
        /// </summary>
        protected void Finish()
        {
            AssertNotFinished();
            _isFinished = true;
            if (!_cancelled)
            {
                var animatedView = _animatedView;
                if (animatedView != null)
                {
                    _propertyUpdater.OnFinish(animatedView);
                }

                var animationFinished = AnimationFinished;
                if (animationFinished != null)
                {
                    animationFinished(this, new AnimationFinishedEventArgs());
                }
            }
        }

        private void AssertNotFinished()
        {
            if (_isFinished)
            {
                throw new InvalidOperationException("Animation is already finished.");
            }
        }
    }
}
