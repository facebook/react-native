using Facebook.CSSLayout;
using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Base node class for representing the virtual tree of React nodes.
    /// Shadow nodes are used primarily for layout, therefore it extends
    /// <see cref="CSSNode"/> to allow that. Instances of this class receive 
    /// property updates from JavaScript via the <see cref="UIManagerModule"/>.
    /// 
    /// This class allows for the native view hierarchy not to be an exact copy
    /// of the hierarchy received from JavaScript by keeping track of both
    /// JavaScript children (e.g., <see cref="CSSNode.ChildCount"/>) and
    /// separately native children (e.g., <see cref="NativeChildCount"/>). See
    /// <see cref="NativeViewHierarchyOptimizer"/> for more information.
    /// </summary>
    public class ReactShadowNode : CSSNode
    {
        private ReactShadowNode _rootNode;
        private ThemedReactContext _themedContext;
        private bool _nodeUpdated = true;

        private bool _isLayoutOnly;
        private int _totalNativeChildren = 0;
        private ReactShadowNode _nativeParent;
        private double _absoluteLeft;
        private double _absoluteTop;
        private double _absoluteRight;
        private double _absoluteBottom;

        private List<ReactShadowNode> _nativeChildren;

        /// <summary>
        /// Nodes that return <code>true</code> will be treated as "virtual"
        /// nodes. That is, nodes that are not mapped into native views (e.g.,
        /// nested text node).
        /// </summary>
        /// <remarks>
        /// By default this method returns <code>false</code>.
        /// </remarks>
        public virtual bool IsVirtual
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Nodes that return <code>true</code> will be treated as a root view
        /// for the virtual nodes tree. It means that 
        /// <see cref="NativeViewHierarchyManager"/> will not try to perform
        /// manage children operations on such views.
        /// </summary>
        public virtual bool IsVirtualAnchor
        {
            get
            {
                return false;
            }
        }

        /// <summary>
        /// Gets the view class of the node.
        /// </summary>
        public string ViewClass
        {
            get;
            internal set;
        }

        /// <summary>
        /// Signals that the node has updates.
        /// </summary>
        public bool HasUpdates
        {
            get
            {
                return _nodeUpdated || HasNewLayout || IsDirty;
            }
        }

        /// <summary>
        /// The tag for the node.
        /// </summary>
        public int ReactTag
        {
            get;
            internal set;
        }

        /// <summary>
        /// The root node of the node.
        /// </summary>
        public ReactShadowNode RootNode
        {
            get
            {
                var rootNode = _rootNode;
                if (rootNode == null)
                {
                    throw new InvalidOperationException("Root node has not been set.");
                }

                return rootNode;
            }
            internal set
            {
                _rootNode = value;
            }
        }

        /// <summary>
        /// Gets the parent of the node.
        /// </summary>
        public new ReactShadowNode Parent
        {
            get
            {
                return (ReactShadowNode)base.Parent;
            }
        }

        /// <summary>
        /// The themed context of the node.
        /// </summary>
        public ThemedReactContext ThemedContext
        {
            get
            {
                var themedContext = _themedContext;
                if (themedContext == null)
                {
                    throw new InvalidOperationException("Themed context has not been set.");
                }

                return themedContext;
            }
            protected internal set
            {
                _themedContext = value;
            }
        }

        /// <summary>
        /// Sets whether the node should notify on layout.
        /// </summary>
        public bool ShouldNotifyOnLayout
        {
            internal get;
            set;
        }

        /// <summary>
        /// The number of native children for the node.
        /// </summary>
        public int NativeChildCount
        {
            get
            {
                return _nativeChildren != null
                    ? _nativeChildren.Count
                    : 0;
            }
        }

        /// <summary>
        /// Gets the native parent for the node.
        /// </summary>
        public ReactShadowNode NativeParent
        {
            get
            {
                return _nativeParent;
            }
        }

        /// <summary>
        /// Signals whether the node is layout-only.
        /// </summary>
        public bool IsLayoutOnly
        {
            get
            {
                return _isLayoutOnly;
            }
            set
            {
                if (Parent != null)
                {
                    throw new InvalidOperationException("Must remove from parent first.");
                }

                if (_nativeParent != null)
                {
                    throw new InvalidOperationException("Must from from native parent first.");
                }

                if (NativeChildCount != 0)
                {
                    throw new InvalidOperationException("Must remove all native children first.");
                }

                _isLayoutOnly = value;
            }
        }

        /// <summary>
        /// Gets the total number of native children in the node hierarchy.
        /// </summary>
        public int TotalNativeChildren
        {
            get
            {
                return _totalNativeChildren;
            }
        }

        /// <summary>
        /// The rounded layout x-coordinate.
        /// </summary>
        public int ScreenX
        {
            get
            {
                return (int)Math.Round(LayoutX);
            }
        }

        /// <summary>
        /// The rounded layout y-coordinate.
        /// </summary>
        public int ScreenY
        {
            get
            {
                return (int)Math.Round(LayoutY);
            }
        }

        /// <summary>
        /// The rounded layout width.
        /// </summary>
        public int ScreenWidth
        {
            get
            {
                return (int)Math.Round(_absoluteRight - _absoluteLeft);
            }
        }

        /// <summary>
        /// The rounded layout height.
        /// </summary>
        public int ScreenHeight
        {
            get
            {
                return (int)Math.Round(_absoluteBottom - _absoluteTop);
            }
        }
        /// <summary>
        /// Marks that an update has been seen.
        /// </summary>
        public void MarkUpdateSeen()
        {
            _nodeUpdated = false;

            if (HasNewLayout)
            {
                MarkLayoutSeen();
            }
        }

        /// <summary>
        /// Insert a child at the given index.
        /// </summary>
        /// <param name="child">The child.</param>
        /// <param name="i">The index.</param>
        public void AddChildAt(CSSNode child, int i)
        {
            InsertChild(i, child);
            MarkUpdated();
            var node = (ReactShadowNode)child;

            var increase = node.IsLayoutOnly ? node._totalNativeChildren : 1;
            _totalNativeChildren += increase;

            UpdateNativeChildrenCountInParent(increase);
        }

        /// <summary>
        /// Removes the child at the given index.
        /// </summary>
        /// <param name="i">The index.</param>
        public new ReactShadowNode RemoveChildAt(int i)
        {
            var removed = RemoveAndReturnChildAt(i);

            MarkUpdated();

            var decrease = removed.IsLayoutOnly ? removed._totalNativeChildren : 1;
            _totalNativeChildren -= decrease;
            UpdateNativeChildrenCountInParent(decrease * -1);
            return removed;
        }

        /// <summary>
        /// Remove all children for the node.
        /// </summary>
        public void RemoveAllChildren()
        {
            var decrease = 0;
            for (var i = ChildCount - 1; i >= 0; --i)
            {
                var removed = RemoveAndReturnChildAt(i);
                decrease += removed.IsLayoutOnly ? removed._totalNativeChildren : 1;
            }

            MarkUpdated();

            _totalNativeChildren -= decrease;
            UpdateNativeChildrenCountInParent(decrease * -1);
        }

        /// <summary>
        /// This method will be called by <see cref="UIManagerModule"/> once
        /// per batch, before calculating layout. This will only be called for
        /// nodes that are marked as updated with <see cref="MarkUpdated"/> or
        /// require layout (i.e., marked with <see cref="dirty"/>).
        /// </summary>
        public virtual void OnBeforeLayout()
        {
        }

        /// <summary>
        /// Updates the properties of the node.
        /// </summary>
        /// <param name="properties">The properties.</param>
        public void UpdateProperties(ReactStylesDiffMap properties)
        {
            var setters = ViewManagersPropertyCache.GetNativePropertySettersForShadowNodeType(GetType());
            foreach (var key in properties.Keys)
            {
                var setter = default(IPropertySetter);
                if (setters.TryGetValue(key, out setter))
                {
                    setter.UpdateShadowNodeProperty(this, properties);
                }
            }

            OnAfterUpdateTransaction();
        }

        /// <summary>
        /// Called following property updates for node.
        /// </summary>
        public virtual void OnAfterUpdateTransaction()
        {
        }

        /// <summary>
        /// Called after a layout step at the end of a UI batch from
        /// <see cref="UIManagerModule"/>. May be used to enqueue additional UI
        /// operations for the native view. Will only be called on nodes marked
        /// as updated either with <see cref="dirty"/> or 
        /// <see cref="MarkUpdated"/>.
        /// </summary>
        /// <param name="uiViewOperationQueue">
        /// Interface for enqueueing UI operations.
        /// </param>
        public virtual void OnCollectExtraUpdates(UIViewOperationQueue uiViewOperationQueue)
        {
        }

        /// <summary>
        /// Gets the child node at the given index.
        /// </summary>
        /// <param name="i">The index.</param>
        /// <returns>The child node.</returns>
        public ReactShadowNode GetChildAt(int i)
        {
            return (ReactShadowNode)this[i];
        }

        /// <summary>
        /// Adds a child that the native view hierarchy will have at this index
        /// in the native view corresponding to this node.
        /// </summary>
        /// <param name="child"></param>
        /// <param name="nativeIndex"></param>
        public void AddNativeChildAt(ReactShadowNode child, int nativeIndex)
        {
            if (IsLayoutOnly || child.IsLayoutOnly)
            {
                throw new InvalidOperationException("Invalid operation for layout-only nodes.");
            }

            if (_nativeChildren == null)
            {
                _nativeChildren = new List<ReactShadowNode>(4);
            }

            _nativeChildren.Insert(nativeIndex, child);
            child._nativeParent = this;
        }

        /// <summary>
        /// Removes the native child at the given index.
        /// </summary>
        /// <param name="i">The index.</param>
        public void RemoveNativeChildAt(int i)
        {
            if (_nativeChildren == null)
            {
                throw new InvalidOperationException("No native children available.");
            }

            var removed = _nativeChildren[i];
            _nativeChildren.RemoveAt(i);
            removed._nativeParent = null;
        }

        /// <summary>
        /// Remove all native children.
        /// </summary>
        public void RemoveAllNativeChildren()
        {
            if (_nativeChildren != null)
            {
                foreach (var item in _nativeChildren)
                {
                    item._nativeParent = null;
                }

                _nativeChildren.Clear();
            }
        }

        /// <summary>
        /// Gets the index of a native child.
        /// </summary>
        /// <param name="nativeChild">The native child.</param>
        /// <returns>The index, or -1 if none is found.</returns>
        public int GetIndexOfNativeChild(ReactShadowNode nativeChild)
        {
            return _nativeChildren.IndexOf(nativeChild);
        }

        /// <summary>
        /// Returns the offset within the native children owned by all layout-
        /// only nodes in the subtree rooted at this node for the given child.
        /// Put another way, this returns the number of native nodes (nodes not
        /// optimized out of the native tree) that are a) to the left (visited
        /// before by a depth-first search) of the given child in the subtree
        /// rooted at this node and b) do not have a native parent in this
        /// subtree (which means that the given child will be a sibling of
        /// theirs in the final native hierarchy since they'll get attached to
        /// the same native parent).
        /// 
        /// Basically, a view might have children that have been optimized away
        /// by <see cref="NativeViewHierarchyOptimizer"/>. Since those children
        /// will then add their native children to this view, we now have
        /// ranges of native children that correspond to single unoptimized
        /// children. The purpose of this method is to return the index within
        /// the native children that corresponds to the start of the native 
        /// children that belong to the given child. Also, note that all of the
        /// children of a view might be optimized away, so this could return
        /// the same value for multiple different children.
        /// </summary>
        /// <param name="child">The child.</param>
        /// <returns>The native offset.</returns>
        public int GetNativeOffsetForChild(ReactShadowNode child)
        {
            var index = 0;
            var found = false;
            for (var i = 0; i < ChildCount; ++i)
            {
                var current = GetChildAt(i);
                if (child == current)
                {
                    found = true;
                    break;
                }

                index += current.IsLayoutOnly ? current.TotalNativeChildren : 1;
            }

            if (!found)
            {
                throw new InvalidOperationException(
                    $"Child '{child.ReactTag}' was not a child of '{ReactTag}'.");
            }

            return index;
        }

        /// <summary>
        /// Dispatches a batch of updates.
        /// </summary>
        /// <param name="absoluteX">The absolute x-coordinate.</param>
        /// <param name="absoluteY">The absolute y-coordinate.</param>
        /// <param name="uiViewOperationQueue">
        /// Interface for enqueueing UI operations.
        /// </param>
        /// <param name="nativeViewHierarchyOptimizer">
        /// Interface for optimizing native hierarchy calls.
        /// </param>
        internal void DispatchUpdates(
            double absoluteX, 
            double absoluteY, 
            UIViewOperationQueue uiViewOperationQueue,
            NativeViewHierarchyOptimizer nativeViewHierarchyOptimizer)
        {
            if (_nodeUpdated)
            {
                OnCollectExtraUpdates(uiViewOperationQueue);
            }

            if (HasNewLayout)
            {
                _absoluteLeft = (int)Math.Round(absoluteX + LayoutX);
                _absoluteTop = (int)Math.Round(absoluteY + LayoutY);
                _absoluteRight = (int)Math.Round(_absoluteLeft + LayoutWidth);
                _absoluteBottom = (int)Math.Round(_absoluteTop + LayoutHeight);

                nativeViewHierarchyOptimizer.HandleUpdateLayout(this);
            }
        }

        /// <summary>
        /// Marks a node as updated.
        /// </summary>
        protected virtual void MarkUpdated()
        {
            if (_nodeUpdated)
            {
                return;
            }

            _nodeUpdated = true;
            var parent = Parent;
            if (parent != null)
            {
                parent.MarkUpdated();
            }
        }

        /// <summary>
        /// Marks that the node is dirty.
        /// </summary>
        protected sealed override void dirty()
        {
            if (!IsVirtual)
            {
                base.dirty();
            }
        }

        private void UpdateNativeChildrenCountInParent(int delta)
        {
            if (IsLayoutOnly)
            {
                var parent = Parent;
                while (parent != null)
                {
                    parent._totalNativeChildren += delta;
                    if (!parent.IsLayoutOnly)
                    {
                        break;
                    }

                    parent = parent.Parent;
                }
            }
        }

        private ReactShadowNode RemoveAndReturnChildAt(int i)
        {
            var removed = this[i];
            base.RemoveChildAt(i);
            return (ReactShadowNode)removed;
        }
    }
}
