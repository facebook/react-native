using System;
using Windows.UI.Xaml;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class providing child management API for view managers.
    /// </summary>
    public abstract class ViewParentManager<TFrameworkElement> : BaseViewManager<TFrameworkElement, LayoutShadowNode>, IViewParentManager
        where TFrameworkElement : FrameworkElement
    {
        /// <summary>
        /// The <see cref="Type"/> instance that represents the type of shadow
        /// node that this manager will return from
        /// <see cref="CreateShadowNodeInstance"/>.
        /// 
        /// This method will be used in the bridge initialization phase to
        /// collect properties exposed using the <see cref="ReactPropertyAttribute"/>
        /// annotation from the <see cref="ReactShadowNode"/> subclass.
        /// </summary>
        public sealed override Type ShadowNodeType
        {
            get
            {
                return base.ShadowNodeType;
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
        public sealed override LayoutShadowNode CreateShadowNodeInstance()
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
        public override void UpdateExtraData(TFrameworkElement root, object extraData)
        {
        }

        /// <summary>
        /// Adds a child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="child">The child view.</param>
        /// <param name="index">The index.</param>
        public abstract void AddView(TFrameworkElement parent, FrameworkElement child, int index);

        /// <summary>
        /// Gets the number of children in the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <returns>The number of children.</returns>
        public abstract int GetChildCount(TFrameworkElement parent);

        /// <summary>
        /// Gets the child at the given index.
        /// </summary>
        /// <param name="parent">The parent view.</param>
        /// <param name="index">The index.</param>
        /// <returns>The child view.</returns>
        public abstract FrameworkElement GetChildAt(TFrameworkElement parent, int index);

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        /// <param name="index">The index.</param>
        public abstract void RemoveChildAt(TFrameworkElement parent, int index);

        /// <summary>
        /// Removes all children from the view parent.
        /// </summary>
        /// <param name="parent">The view parent.</param>
        public abstract void RemoveAllChildren(TFrameworkElement parent);

        #region IViewParentManager

        void IViewParentManager.AddView(FrameworkElement parent, FrameworkElement child, int index)
        {
            AddView((TFrameworkElement)parent, child, index);
        }

        int IViewParentManager.GetChildCount(FrameworkElement parent)
        {
            return GetChildCount((TFrameworkElement)parent);
        }

        FrameworkElement IViewParentManager.GetChildAt(FrameworkElement parent, int index)
        {
            return GetChildAt((TFrameworkElement)parent, index);
        }

        void IViewParentManager.RemoveChildAt(FrameworkElement parent, int index)
        {
            RemoveChildAt((TFrameworkElement)parent, index);
        }

        void IViewParentManager.RemoveAllChildren(FrameworkElement parent)
        {
            RemoveAllChildren((TFrameworkElement)parent);
        }

        #endregion
    }
}
