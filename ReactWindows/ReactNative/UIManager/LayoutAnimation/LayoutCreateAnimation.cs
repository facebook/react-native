using Windows.UI.Xaml;
using Windows.UI.Xaml.Media.Animation;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Layout animation manager for newly created views.
    /// </summary>
    class LayoutCreateAnimation : BaseLayoutAnimation
    {
        /// <summary>
        /// Create a <see cref="Storyboard"/> to be used to animate the view, 
        /// based on the animation configuration supplied at initialization
        /// time and the new view position and size.
        /// </summary>
        /// <param name="view">The view to create the animation for.</param>
        /// <param name="x">The new X-coordinate for the view.</param>
        /// <param name="y">The new Y-coordinate for the view.</param>
        /// <param name="width">The new width for the view.</param>
        /// <param name="height">The new height for the view.</param>
        /// <returns>The storyboard.</returns>
        protected override Storyboard CreateAnimationCore(FrameworkElement view, int x, int y, int width, int height)
        {
            // TODO: create animations are temporarily disabled.
            return null;
        }

        /// <summary>
        /// Signals if the animation should be performed in reverse.
        /// </summary>
        protected override bool IsReverse
        {
            get
            {
                return false;
            }
        }
    }
}
