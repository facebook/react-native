#define ENABLED

using Facebook.CSSLayout;
using System;
using System.Collections.Generic;
using System.Linq;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Class responsible for optimizing the native view hierarchy while still
    /// respecting the final UI product specified by JavaScript. Basically,
    /// JavaScript sends a hierarchy of nodes that, while easy to reason about
    /// in JavaScript, are very inefficient to translate directly to native
    /// views. This class sits between <see cref="UIManagerModule"/>, which
    /// received view commands from JavaScript, and <see cref="UIViewOperationQueue"/>,
    /// which enqueues actual operations on the native view hierarchy. It is
    /// able to take instructions from <see cref="UIManagerModule"/> and
    /// output instructions to the native view hierarchy that achieve the same
    /// displayed UI but with fewer views.
    /// 
    /// Currently, this class is only used to remove layout-only views, that
    /// is to say views that only affect the positions of their children but do
    /// not draw anything themselves. These views are faily common because
    /// 1) containers are used to do layouting via flexbox and 2) the return of
    /// each render call in JavaScript must be exactly one view, which means
    /// views are often wrapped in an unnecessary layer of hierarchy.
    /// 
    /// This optimization is implemented by keeping track of both the
    /// unoptimized JavaScript hierarchy and the optimized native hierarchy in
    /// <see cref="ReactShadowNode"/>.
    /// 
    /// This optimization is important for view hierarchy depth (which can 
    /// cause stack overflows during view traversal for complex apps), memory
    /// usage, amount of time spent in GC, and time-to-display.
    /// 
    /// Some examples of the optimizations this class will do based on commands
    /// from JavaScript:
    /// - Create a view with only layout properties: a description of that view
    ///   is created as a <see cref="ReactShadowNode"/> in <see cref="UIManagerModule"/>,
    ///   but this class will not output any commands to create the view in the
    ///   native view hierarchy.
    /// - Update a layout-only view to have non-layout properties: before
    ///   issuing the call to update the shadow node, issue commands to create
    ///   the view we optimized away and move it into the view hierarchy.
    /// - Manage the children of a view: multiple calls to manage children for
    ///   various parent views may be issued to the native view hierarchy
    ///   depending on where the views being added/removed are attached in the
    ///   optimized hierarchy.
    /// </summary>
    public class NativeViewHierarchyOptimizer
    {
        private readonly UIViewOperationQueue _uiViewOperationQueue;
        private readonly ShadowNodeRegistry _shadowNodeRegistry;
        private readonly IDictionary<int, bool> _tagsWithLayoutVisited;

        public NativeViewHierarchyOptimizer(
            UIViewOperationQueue uiViewOperationQueue,
            ShadowNodeRegistry shadowNodeRegistry)
        {
            _uiViewOperationQueue = uiViewOperationQueue;
            _shadowNodeRegistry = shadowNodeRegistry;
            _tagsWithLayoutVisited = new Dictionary<int, bool>();
        }

        /// <summary>
        /// Handles the creation of a view.
        /// </summary>
        /// <param name="node">The shadow node for the view.</param>
        /// <param name="themedContext">The themed context.</param>
        /// <param name="initialProperties">
        /// The initial properties for the view.
        /// </param>
        public void HandleCreateView(
            ReactShadowNode node, 
            ThemedReactContext themedContext, 
            CatalystStylesDiffMap initialProperties)
        {
#if !ENABLED
            _uiViewOperationQueue.EnqueueCreateView(
                    themedContext,
                    node.ReactTag,
                    node.ViewClass,
                    initialProperties);
#else
            var isLayoutOnly = node.ViewClass == ViewProperties.ViewClassName
                && IsLayoutOnlyAndCollapsible(initialProperties);

            node.IsLayoutOnly = isLayoutOnly;

            if (!isLayoutOnly)
            {
                _uiViewOperationQueue.EnqueueCreateView(
                    themedContext,
                    node.ReactTag,
                    node.ViewClass,
                    initialProperties);
            }
#endif
        }

        /// <summary>
        /// Handles a call to <see cref="UIManagerModule.updateView(int, string, Newtonsoft.Json.Linq.JObject)"/>.
        /// If a view transitions from being layout-only to not (or vice versa)
        /// this could result in some number of additional create view or
        /// manage children calls. If the view is layout only, no update view
        /// call will be dispatched to the native hierarchy.
        /// </summary>
        /// <param name="node">The node.</param>
        /// <param name="className">The class name.</param>
        /// <param name="properties">The properties.</param>
        public void HandleUpdateView(ReactShadowNode node, string className, CatalystStylesDiffMap properties)
        {
#if !ENABLED
            _uiViewOperationQueue.EnqueueUpdateProperties(node.ReactTag, className, properties);
#else
            var needsToLeaveLayoutOnly = node.IsLayoutOnly && !IsLayoutOnlyAndCollapsible(properties);
            if (needsToLeaveLayoutOnly)
            {
                TransitionLayoutOnlyViewToNativeView(node, properties);
            }
            else if (!node.IsLayoutOnly)
            {
                _uiViewOperationQueue.EnqueueUpdateProperties(node.ReactTag, className, properties);
            }
#endif
        }

        /// <summary>
        /// Handles a manage children call. This may translate into multiple
        /// manage children calls for multiple other views.
        /// </summary>
        /// <param name="nodeToManage">The node to manage.</param>
        /// <param name="indicesToRemove">The indices to remove.</param>
        /// <param name="tagsToRemove">The tags to remove.</param>
        /// <param name="viewsToAdd">The views to add.</param>
        /// <param name="tagsToDelete">The tags to delete.</param>
        /// <remarks>
        /// The assumption for calling this method is that all corresponding
        /// <see cref="ReactShadowNode"/>s have been updated, but
        /// <paramref name="tagsToDelete"/> have not been deleted yet. This is
        /// because we need to use the metadata from those nodes to figure out
        /// the correct commands to dispatch. This is unlike other calls on
        /// this class where we assume all operations on the shadow hierarchy
        /// have already completed by the time a corresponding method here is
        /// called.
        /// </remarks>
        public void HandleManageChildren(ReactShadowNode nodeToManage, int[] indicesToRemove, int[] tagsToRemove, ViewAtIndex[] viewsToAdd, int[] tagsToDelete)
        {
#if !ENABLED
            _uiViewOperationQueue.EnqueueManageChildren(
                nodeToManage.ReactTag,
                indicesToRemove,
                viewsToAdd,
                tagsToDelete);
#else
            // We operate on tagsToRemove instead of indicesToDelete because by
            // the time this method is called, these views have already been
            // removed from the shadow hierarchy and the indices are no longer
            // useful to operate on.
            for (var i = 0; i < tagsToRemove.Length; ++i)
            {
                var tagToRemove = tagsToRemove[i];
                var delete = tagsToDelete.Contains(tagToRemove);
                var nodeToRemove = _shadowNodeRegistry.GetNode(tagToRemove);
                RemoveNodeFromParent(nodeToRemove, delete);
            }

            for (var i = 0; i < viewsToAdd.Length; ++i)
            {
                var toAdd = viewsToAdd[i];
                var nodeToAdd = _shadowNodeRegistry.GetNode(toAdd.Tag);
                AddNodeToNode(nodeToManage, nodeToAdd, toAdd.Index);
            }
#endif
        }

        /// <summary>
        /// Handles an update layout call. All update layout calls are 
        /// collected and dispatched at the end of a batch because update
        /// layout calls to layout-only nodes can necessitate multiple update
        /// layout calls for all its children.
        /// </summary>
        /// <param name="node">The node.</param>
        public void HandleUpdateLayout(ReactShadowNode node)
        {
#if !ENABLED
            _uiViewOperationQueue.EnqueueUpdateLayout(
                node.Parent.ReactTag,
                node.ReactTag,
                node.ScreenX,
                node.ScreenY,
                node.ScreenWidth,
                node.ScreenHeight);
#else
            ApplyLayoutBase(node);
#endif
        }

        /// <summary>
        /// Processes the shadow hierarchy to dispatch all necessary update
        /// layout calls to the native hierarcy. Should be called after all
        /// update layout calls for a batch have been handled.
        /// </summary>
        public void OnBatchComplete()
        {
            _tagsWithLayoutVisited.Clear();
        }

        /// <summary>
        /// Handles native children cleanup when the shadow node is removed
        /// from the hierarchy.
        /// </summary>
        /// <param name="node">The node to cleanup.</param>
        public void HandleRemoveNode(ReactShadowNode node)
        {
            node.RemoveAllNativeChildren();
        }

#if ENABLED
        private void AddNodeToNode(ReactShadowNode parent, ReactShadowNode child, int index)
        {
            var indexInNativeChildren = parent.GetNativeOffsetForChild(parent.GetChildAt(index));

            if (!parent.IsLayoutOnly && !child.IsLayoutOnly)
            {
                AddNonLayoutOnlyNodeToNonLayoutOnlyNode(parent, child, indexInNativeChildren);
            }
            else if (!child.IsLayoutOnly)
            {
                AddNonLayoutOnlyNodeToLayoutOnlyNode(parent, child, indexInNativeChildren);
            }
            else if (!parent.IsLayoutOnly)
            {
                AddLayoutOnlyNodeToNonLayoutOnlyNode(parent, child, indexInNativeChildren);
            }
            else
            {
                AddLayoutOnlyNodeToLayoutOnlyNode(parent, child, indexInNativeChildren);
            }
        }

        private void RemoveNodeFromParent(ReactShadowNode nodeToRemove, bool shouldDelete)
        {
            var nativeNodeToRemoveFrom = nodeToRemove.NativeParent;

            if (nativeNodeToRemoveFrom != null)
            {
                var index = nativeNodeToRemoveFrom.GetIndexOfNativeChild(nodeToRemove);
                nativeNodeToRemoveFrom.RemoveNativeChildAt(index);
                _uiViewOperationQueue.EnqueueManageChildren(
                    nativeNodeToRemoveFrom.ReactTag,
                    new int[] { index },
                    null,
                    shouldDelete ? new int[] { nodeToRemove.ReactTag } : null);
            }
            else
            {
                for (var i = nodeToRemove.ChildCount - 1; i >= 0; --i)
                {
                    RemoveNodeFromParent(nodeToRemove.GetChildAt(i), shouldDelete);
                }
            }
        }

        private void AddLayoutOnlyNodeToLayoutOnlyNode(ReactShadowNode parent, ReactShadowNode child, int index)
        {
            var parentParent = parent.Parent;
            
            // If the parent hasn't been attached to its parent yet, don't
            // issue commands to the native hierarchy. This will occur when the
            // parent node actually gets attached somewhere.
            if (parentParent == null)
            {
                return;
            }

            var transformedIndex = index + parentParent.GetNativeOffsetForChild(parent);
            if (parentParent.IsLayoutOnly)
            {
                AddLayoutOnlyNodeToLayoutOnlyNode(parentParent, child, transformedIndex);
            }
            else
            {
                AddLayoutOnlyNodeToNonLayoutOnlyNode(parentParent, child, transformedIndex);
            }
        }

        private void AddNonLayoutOnlyNodeToLayoutOnlyNode(ReactShadowNode parent, ReactShadowNode child, int index)
        {
            var parentParent = parent.Parent;

            // If the parent hasn't been attached to its parent yet, don't
            // issue commands to the native hierarchy. This will occur when the
            // parent node actually gets attached somewhere.
            if (parentParent == null)
            {
                return;
            }

            var transformedIndex = index + parentParent.GetNativeOffsetForChild(parent);
            if (parentParent.IsLayoutOnly)
            {
                AddNonLayoutOnlyNodeToLayoutOnlyNode(parentParent, child, transformedIndex);
            }
            else
            {
                AddNonLayoutOnlyNodeToNonLayoutOnlyNode(parentParent, child, transformedIndex);
            }
        }

        private void AddLayoutOnlyNodeToNonLayoutOnlyNode(ReactShadowNode parent, ReactShadowNode child, int index)
        {
            var currentIndex = index;
            for (var i = 0; i < child.ChildCount; ++i)
            {
                var childToAdd = child.GetChildAt(i);
                if (childToAdd.IsLayoutOnly)
                {
                    var childCountBefore = parent.NativeChildCount;
                    AddLayoutOnlyNodeToNonLayoutOnlyNode(
                        parent,
                        childToAdd,
                        currentIndex);
                    var childCountAfter = parent.NativeChildCount;
                    currentIndex += childCountAfter - childCountBefore;
                }
                else
                {
                    AddNonLayoutOnlyNodeToNonLayoutOnlyNode(parent, childToAdd, currentIndex++);
                }
            }
        }

        private void AddNonLayoutOnlyNodeToNonLayoutOnlyNode(ReactShadowNode parent, ReactShadowNode child, int index)
        {
            parent.AddNativeChildAt(child, index);
            _uiViewOperationQueue.EnqueueManageChildren(
                parent.ReactTag,
                null,
                new[] { new ViewAtIndex(child.ReactTag, index) },
                null);
        }

        private void ApplyLayoutBase(ReactShadowNode node)
        {
            var tag = node.ReactTag;
            var visited = default(bool);
            if (_tagsWithLayoutVisited.TryGetValue(tag, out visited) && visited)
            {
                return;
            }

            _tagsWithLayoutVisited.Add(tag, true);

            var parent = node.Parent;

            // We use ScreenX/ScreenY (which round to integer pixels) at each
            // node in the hierarchy to emulate what the layout would look like
            // if it were actually built with native views, which have integral
            // top/left/bottom/right values.
            var x = node.ScreenX;
            var y = node.ScreenY;

            while (parent != null && parent.IsLayoutOnly)
            {
                x += (int)Math.Round(parent.LayoutX);
                y += (int)Math.Round(parent.LayoutY);
                parent = parent.Parent;
            }

            // This is a hack that accomodates for the fact that borders are
            // wrapped around the canvases that contain the UI elements. It is
            // likely to prove brittle over time, and we should consider either
            // alternate ways of drawing borders, or different mechanisms to
            // set absolute positions of elements.
            var borderParent = node.Parent;
            if (borderParent != null && borderParent.IsLayoutOnly)
            {
                borderParent = node.NativeParent;
            }

            if (borderParent != null)
            {
                x -= (int)Math.Round(borderParent.GetLeftBorderWidth());
                y -= (int)Math.Round(borderParent.GetTopBorderWidth());
            }

            ApplyLayoutRecursive(node, x, y);
        }

        private void ApplyLayoutRecursive(ReactShadowNode node, int x, int y)
        {
            if (!node.IsLayoutOnly && node.NativeParent != null)
            {
                _uiViewOperationQueue.EnqueueUpdateLayout(
                    node.NativeParent.ReactTag,
                    node.ReactTag,
                    x,
                    y,
                    node.ScreenWidth,
                    node.ScreenHeight);

                return;
            }

            for (var i = 0; i < node.ChildCount; ++i)
            {
                var child = node.GetChildAt(i);
                var visited = default(bool);
                if (_tagsWithLayoutVisited.TryGetValue(child.ReactTag, out visited) && visited)
                {
                    continue;
                }

                _tagsWithLayoutVisited.Add(child.ReactTag, true);

                var childX = child.ScreenX;
                var childY = child.ScreenY;

                childX += x;
                childY += y;

                ApplyLayoutRecursive(child, childX, childY);
            }
        }

        private void TransitionLayoutOnlyViewToNativeView(ReactShadowNode node, CatalystStylesDiffMap properties)
        {
            var parent = node.Parent;
            if (parent == null)
            {
                node.IsLayoutOnly = false;
                return;
            }

            // First, remove the node from its parent. This causes the parent
            // to update its native children count. The call will cause all the
            // view's children to be detached from their native parent.
            var childIndex = parent.IndexOf(node);
            parent.RemoveChildAt(childIndex);
            RemoveNodeFromParent(node, false);

            node.IsLayoutOnly = false;

            // Create the view since it doesn't exist in the native hierarchy yet.
            _uiViewOperationQueue.EnqueueCreateView(
                node.RootNode.ThemedContext,
                node.ReactTag,
                node.ViewClass,
                properties);

            // Add the node and all its children as if adding new nodes.
            parent.AddChildAt(node, childIndex);
            AddNodeToNode(parent, node, childIndex);
            for (var i = 0; i < node.ChildCount; ++i)
            {
                AddNodeToNode(node, node.GetChildAt(i), i);
            }

            // Update layouts since the children of the node were offset by its
            // x/y position previously. (Warning: bit of a hack) We need to
            // update the layout of this node's children now that it's no 
            // longer layout-only, but we may still receive more layout updates
            // at the end of this batch that we don't want to ignore.
            ApplyLayoutBase(node);
            for (var i = 0; i < node.ChildCount; ++i)
            {
                ApplyLayoutBase(node.GetChildAt(i));
            }

            _tagsWithLayoutVisited.Clear();
        }

        private bool IsLayoutOnlyAndCollapsible(CatalystStylesDiffMap properties)
        {
            if (properties == null)
            {
                return true;
            }

            if (properties.Keys.Contains(ViewProperties.Collapsible) && !properties.GetProperty<bool>(ViewProperties.Collapsible))
            {
                return false;
            }

            foreach (var key in properties.Keys)
            {
                if (!ViewProperties.IsLayoutOnly(key))
                {
                    return false;
                }
            }

            return true;
        }
#endif
    }
}
