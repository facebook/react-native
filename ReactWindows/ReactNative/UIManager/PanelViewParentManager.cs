using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class providing child management API for view managers of classes
    /// extending <see cref="Panel"/>.
    /// </summary>
    /// <typeparam name="TPanel">Type of panel.</typeparam>
    public abstract class PanelViewParentManager<TPanel> : ViewParentManager<TPanel>
        where TPanel : Panel
    {
        /// <summary>
        /// Gets the number of children for the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        public override int GetChildCount(TPanel parent)
        {
            return parent.Children.Count;
        }

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        public override FrameworkElement GetChildAt(TPanel parent, int index)
        {
            return (FrameworkElement)parent.Children[index];
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        public sealed override void AddView(TPanel parent, FrameworkElement child, int index)
        {
            parent.Children.Insert(index, child);
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        public override void RemoveChildAt(TPanel parent, int index)
        {
            parent.Children.RemoveAt(index);
        }

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        public override void RemoveAllChildren(TPanel parent)
        {
            parent.Children.Clear();
        }
    }
}
