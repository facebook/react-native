using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;

namespace ReactNative.Animation
{
    public abstract class AnimationManager
    {
        private readonly IAnimationPropertyUpdater _PropertyUpdater;

        public AnimationManager(int animationID, IAnimationPropertyUpdater propertyUpdater)
        {
            AnimationId = animationID;
            _PropertyUpdater = propertyUpdater;
        }

        public IAnimationListener AnimationListener{ get; set; }

        protected FrameworkElement View { get; private set; }

        private bool Cancelled { get; set; }

        private bool Finished { get; set; }

        public int AnimationId { get; set; }

        public abstract void run();

        public void start(FrameworkElement view)
        {
            View = view;
            _PropertyUpdater.prepare(view);
            run();
        }

        /// <summary>
        /// Animation engine should call this method for every animation frame passing animation progress
        /// value as a parameter. Animation progress should be within the range 0..1 (the exception here
        /// would be a spring animation engine which may slightly exceed start and end progress values).
        /// 
        /// This method will return false if the animation has been cancelled. In that case animation
        /// engine should not attempt to call this method again. Otherwise this method will return true.
        /// </summary>
        /// <param name="value"></param>
        /// <returns></returns>
        protected bool onUpdate(float value)
        {
            if (!Cancelled && View != null)
            {
                _PropertyUpdater.onUpdate(View, value);
            }

            return !Cancelled;
        }

        /// <summary>
        /// Animation engine should call this method when the animation is finished. Should be called only once.
        /// </summary>
        protected void finish()
        {
            if (Finished)
            {
                throw new InvalidOperationException("Calling finish while the animation engine is already in finished state.");
            }

            Finished = true;
            if (!Cancelled)
            {
                if (View != null)
                {
                    _PropertyUpdater.onFinish(View);
                }
                if (AnimationListener != null)
                {
                    AnimationListener.onFinished();
                }
            }
        }

        /// <summary>
        /// Cancels the animation.
        /// </summary>
        public void cancel()
        {
            if (Finished || Cancelled)
            {
                // If we were already finished, ignore
                return;
            }

            Cancelled = true;
            if (AnimationListener != null)
            {
                AnimationListener.onCancel();
            }
        }
    }
}
