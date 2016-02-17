using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Interface providing child management API for view managers.
    /// </summary>
    public interface IViewParentManager : IViewManager
    {
        /// <summary>
        /// Signals whether the view type needs to handle laying out its own
        /// children instead of deferring to the standard CSS layout algorithm.
        /// </summary>
        bool NeedsCustomLayoutForChildren { get; }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        void AddView(FrameworkElement parent, FrameworkElement child, int index);

        /// <summary>
        /// Gets the number of children in the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        int GetChildCount(FrameworkElement parent);

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        FrameworkElement GetChildAt(FrameworkElement parent, int index);

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        void RemoveChildAt(FrameworkElement parent, int index);

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        void RemoveAllChildren(FrameworkElement parent);
    }
}
