using System;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class providing child management API for view managers.
    /// </summary>
    public abstract class ViewGroupManager : ViewManager
    {
        public sealed override Type ShadowNodeType
        {
            get
            {
                return typeof(LayoutShadowNode);
            }
        }

        /// <summary>
        /// Signals whether the view type needs to handle laying out its own
        /// children instead of deferring to the standard CSS layout algorithm.
        /// </summary>
        public virtual bool NeedsCustomLayoutForChildren
        {
            get
            {
                return false;
            }
        }


        /// <summary>
        /// Creates a shadow node instance for the view manager.
        /// </summary>
        /// <returns>The shadow node instance.</returns>
        public sealed override ReactShadowNode CreateShadowNodeInstance()
        {
            return new LayoutShadowNode();
        }

        /// <summary>
        /// Implement this method to receive optional extra data enqueued from
        /// the corresponding instance of <see cref="ReactShadowNode"/> in
        /// <see cref="ReactShadowNode.OnCollectExtraUpdates"/>.
        /// </summary>
        /// <param name="root">The root view.</param>
        /// <param name="extraData">The extra data.</param>
        public override void UpdateExtraData(FrameworkElement root, object extraData)
        {
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        public abstract void AddView(FrameworkElement parent, FrameworkElement child, int index);

        /// <summary>
        /// Gets the number of children in the view group.
        /// </summary>
        /// <param name="parent">The view group.</param>
        /// <returns>The number of children.</returns>
        public abstract int GetChildCount(FrameworkElement parent);

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        public abstract FrameworkElement GetChildAt(FrameworkElement parent, int index);

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view group.</param>
        /// <param name="index">The index.</param>
        public abstract void RemoveChildAt(FrameworkElement parent, int index);

        /// <summary>
        /// Removes all children from the view group.
        /// </summary>
        /// <param name="parent">The view group.</param>
        public abstract void RemoveAllChildren(FrameworkElement parent);
    }
}
