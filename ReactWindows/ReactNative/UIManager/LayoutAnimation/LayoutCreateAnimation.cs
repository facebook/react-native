using System;
using System.Reactive;
using System.Reactive.Linq;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager.LayoutAnimation
{
    /// <summary>
    /// Layout animation manager for newly created views.
    /// </summary>
    class LayoutCreateAnimation : BaseLayoutAnimation
    {
        /// <summary>
        /// Create an observable animation to be used to animate the view, 
        /// based on the animation configuration supplied at initialization
        /// time and the new view position and size.
        /// </summary>
        /// <param name="view">The view to create the animation for.</param>
        /// <param name="x">The new X-coordinate for the view.</param>
        /// <param name="y">The new Y-coordinate for the view.</param>
        /// <param name="width">The new width for the view.</param>
        /// <param name="height">The new height for the view.</param>
        /// <returns>
        /// An observable sequence that starts an animation when subscribed to,
        /// stops the animation when disposed, and that completes 
        /// simultaneously with the underlying animation.
        /// </returns>
        protected override IObservable<Unit> CreateAnimationCore(FrameworkElement view, int x, int y, int width, int height)
        {
            Canvas.SetLeft(view, x);
            Canvas.SetTop(view, y);
            view.Width = width;
            view.Height = height;

            return base.CreateAnimationCore(view, x, y, width, height);
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
