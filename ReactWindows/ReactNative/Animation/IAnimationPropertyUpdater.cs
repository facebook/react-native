using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Windows.UI.Xaml;

namespace ReactNative.Animation
{
    /// <summary>
    /// Interface used to update particular property types during animation. While animation is in progress <see cref="AnimationManager"/> instance will 
    /// call <see cref="onUpdate(FrameworkElement, float)"/> several times with a value representing animation progress. Normally value will be from 0..1 range, 
    /// but for spring animation it can slightly exceed that limit due to bounce effect at the start/end of animation.
    /// </summary>
    public interface IAnimationPropertyUpdater
    {
        /// <summary>
        /// This method will be called before animation starts.
        /// </summary>
        /// <param name="view">view that will be animated</param>
        void prepare(FrameworkElement view);

        /// <summary>
        /// This method will be called for each animation frame.
        /// </summary>
        /// <param name="view">view to update property</param>
        /// <param name="progress">animation progress from 0..1 range retrieved from <see cref="AnimationManager"/> engine.</param>
        void onUpdate(FrameworkElement view, float progress);

        /// <summary>
        /// This method will be called at the end of animation. It should be used to set the final values
        /// or animated properties in order to avoid floating point inacurracy calculated in <see cref="onUpdate(FrameworkElement, float)"/>
        /// by passing value close to 1.0 or in a case some frames got dropped.
        /// </summary>
        /// <param name="view">view to update property</param>
        void onFinish(FrameworkElement view);
    }
}
