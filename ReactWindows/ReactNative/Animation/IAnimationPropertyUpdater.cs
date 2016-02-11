using Windows.UI.Xaml;

namespace ReactNative.Animation
{
    /// <summary>
    /// Interface used to update particular property types during animation.
    /// While animation is in progress, the <see cref="ReactAnimation"/>
    /// instance will call <see cref="OnUpdate(FrameworkElement, double)"/>
    /// several times with a value representing animation progress.
    /// </summary>
    public interface IAnimationPropertyUpdater
    {
        /// <summary>
        /// Called before the animation starts to prepare the view.
        /// </summary>
        /// <param name="view">The view to update.</param>
        void Prepare(FrameworkElement view);

        /// <summary>
        /// Called for each animation frame.
        /// </summary>
        /// <param name="view">The view to update.</param>
        /// <param name="value">The progress.</param>
        void OnUpdate(FrameworkElement view, double value);

        /// <summary>
        /// Called at the end of the animation frame.
        /// </summary>
        /// <remarks>
        /// This method should be used to set the final values for animated
        /// properties in order to avoid floating point inaccuracies.
        /// </remarks>
        /// <param name="view">The view to update.</param>
        void OnFinish(FrameworkElement view);
    }
}
