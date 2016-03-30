using ReactNative.UIManager;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// View parent manager for bordered canvases.
    /// </summary>
    public abstract class BorderedCanvasManager<TCanvas> : BorderedViewParentManager<TCanvas>
        where TCanvas : Canvas
    {
        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        protected override void AddView(TCanvas parent, FrameworkElement child, int index)
        {
            parent.Children.Insert(index, child);
        }

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        protected override FrameworkElement GetChildAt(TCanvas parent, int index)
        {
            return (FrameworkElement)parent.Children[index];
        }

        /// <summary>
        /// Gets the number of children in the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        protected override int GetChildCount(TCanvas parent)
        {
            return parent.Children.Count;
        }

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        protected override void RemoveAllChildren(TCanvas parent)
        {
            parent.Children.Clear();
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        protected override void RemoveChildAt(TCanvas parent, int index)
        {
            parent.Children.RemoveAt(index);
        }
    }
}
