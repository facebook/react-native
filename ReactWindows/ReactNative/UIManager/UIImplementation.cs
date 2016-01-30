using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Tracing;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.CompilerServices;

namespace ReactNative.UIManager
{
    /// <summary>
    /// An class that is used to receive React commands from JavaScript and 
    /// translate them into a shadow node hierarchy that is then mapped to a
    /// native view hierarchy.
    /// </summary>
    /// <remarks>
    /// TODO: Animation support
    /// </remarks>
    public class UIImplementation
    {
        private readonly int[] _measureBuffer = new int[4];

        private readonly ViewManagerRegistry _viewManagers;
        private readonly UIViewOperationQueue _operationsQueue;
        private readonly ShadowNodeRegistry _shadowNodeRegistry;
        private readonly NativeViewHierarchyOptimizer _nativeViewHierarchyOptimizer;

        /// <summary>
        /// Instantiates the <see cref="UIImplementation"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="viewManagers">The view managers.</param>
        public UIImplementation(ReactContext reactContext, IReadOnlyList<ViewManager> viewManagers)
            : this(reactContext, new ViewManagerRegistry(viewManagers))
        {
        }

        private UIImplementation(ReactContext reactContext, ViewManagerRegistry viewManagers)
            : this(
                  viewManagers,
                  new UIViewOperationQueue(reactContext, new NativeViewHierarchyManager(viewManagers)))
        {
        }

        /// <summary>
        /// Instantiates the <see cref="UIImplementation"/>.
        /// </summary>
        /// <param name="viewManagers">The view managers.</param>
        /// <param name="operationsQueue">The operations queue.</param>
        protected UIImplementation(
            ViewManagerRegistry viewManagers,
            UIViewOperationQueue operationsQueue)
        {
            _viewManagers = viewManagers;
            _operationsQueue = operationsQueue;
            _shadowNodeRegistry = new ShadowNodeRegistry();
            _nativeViewHierarchyOptimizer = new NativeViewHierarchyOptimizer(
                _operationsQueue,
                _shadowNodeRegistry);
        }

        /// <summary>
        /// Register the root view.
        /// </summary>
        /// <param name="rootView">The root view.</param>
        /// <param name="tag">The view tag.</param>
        /// <param name="width">The width.</param>
        /// <param name="height">The height.</param>
        /// <param name="context">The context.</param>
        public void RegisterRootView(
            SizeMonitoringCanvas rootView,
            int tag,
            int width,
            int height,
            ThemedReactContext context)
        {
            var rootCssNode = CreateRootShadowNode();
            rootCssNode.ReactTag = tag;
            rootCssNode.ThemedContext = context;
            rootCssNode.Width = width;
            rootCssNode.Height = height;
            _shadowNodeRegistry.AddRootNode(rootCssNode);

            // Register it with the NativeViewHierarchyManager.
            _operationsQueue.AddRootView(tag, rootView, context);
        }

        /// <summary>
        /// Unregisters a root view with the given tag.
        /// </summary>
        /// <param name="rootViewTag">The root view tag.</param>
        public void RemoveRootView(int rootViewTag)
        {
            _shadowNodeRegistry.RemoveRootNode(rootViewTag);
            _operationsQueue.EnqueueRemoveRootView(rootViewTag);
        }

        /// <summary>
        /// Invoked when the native view that corresponds to a root node has
        /// its size changed.
        /// </summary>
        /// <param name="rootViewTag">The root view tag.</param>
        /// <param name="newWidth">The new width.</param>
        /// <param name="newHeight">The new height.</param>
        /// <param name="eventDispatcher">The event dispatcher.</param>
        public void UpdateRootNodeSize(
            int rootViewTag,
            int newWidth,
            int newHeight,
            EventDispatcher eventDispatcher)
        {
            var rootCssNode = _shadowNodeRegistry.GetNode(rootViewTag);
            rootCssNode.Width = newWidth;
            rootCssNode.Height = newHeight;

            // If we're in the middle of a batch, the change will be
            // automatically dispatched at the end of the batch. The event
            // queue should always be empty, but that is an implementation
            // detail.
            if (_operationsQueue.IsEmpty())
            {
                DispatchViewUpdates(eventDispatcher, -1 /* no associated batch id */);
            }
        }

        /// <summary>
        /// Invoked by React to create a new node with the given tag, class
        /// name, and properties.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="className">The class name.</param>
        /// <param name="rootViewTag">The root view tag.</param>
        /// <param name="properties">The properties.</param>
        public void CreateView(int tag, string className, int rootViewTag, JObject properties)
        {
            var cssNode = CreateShadowNode(className);
            var rootNode = _shadowNodeRegistry.GetNode(rootViewTag);
            cssNode.ReactTag = tag;
            cssNode.ViewClass = className;
            cssNode.RootNode = rootNode;
            cssNode.ThemedContext = rootNode.ThemedContext;

            _shadowNodeRegistry.AddNode(cssNode);

            var styles = default(ReactStylesDiffMap);
            if (properties != null)
            {
                styles = new ReactStylesDiffMap(properties);
                cssNode.UpdateProperties(styles);
            }

            HandleCreateView(cssNode, rootViewTag, styles);
        }

        /// <summary>
        /// Invoked by React to create a new node with a given tag, class name and properties.
        /// </summary>
        /// <param name="config">the animation configuration properties.</param>
        /// <param name="success">Success callback.</param>
        /// <param name="error">Error callback.</param>
        public void ConfigureNextLayoutAnimation(JObject config, ICallback success, ICallback error)
        {
            _operationsQueue.EnqueueConfigureLayoutAnimation(config, success, error);
        }

        /// <summary>
        /// Invoked by React when the properties change for a node with the
        /// given tag.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="className">The view class name.</param>
        /// <param name="properties">The properties.</param>
        public void UpdateView(int tag, string className, JObject properties)
        {
            var viewManager = _viewManagers.Get(className);
            var cssNode = _shadowNodeRegistry.GetNode(tag);
            if (cssNode == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Trying to update view with invalid tag '{0}'.",
                        tag));
            }

            if (properties != null)
            {
                var styles = new ReactStylesDiffMap(properties);
                cssNode.UpdateProperties(styles);
                HandleUpdateView(cssNode, className, styles);
            }
        }

        /// <summary>
        /// Manage the children of a view.
        /// </summary>
        /// <param name="viewTag">The view tag of the parent view.</param>
        /// <param name="moveFrom">
        /// A list of indices in the parent view to move views from.
        /// </param>
        /// <param name="moveTo">
        /// A list of indices in the parent view to move views to.
        /// </param>
        /// <param name="addChildTags">
        /// A list of tags of views to add to the parent.
        /// </param>
        /// <param name="addAtIndices">
        /// A list of indices to insert the child tags at.
        /// </param>
        /// <param name="removeFrom">
        /// A list of indices to permanently remove. The memory for the
        /// corresponding views and data structures should be reclaimed.
        /// </param>
        public void ManageChildren(
            int viewTag, 
            int[] moveFrom,
            int[] moveTo,
            int[] addChildTags,
            int[] addAtIndices, 
            int[] removeFrom)
        {
            if (moveFrom?.Length != moveTo?.Length)
            {
                throw new ArgumentException(
                    "Size of 'moveFrom' does not equal size of 'moveTo'.",
                    nameof(moveFrom));
            }

            if (addChildTags?.Length != addAtIndices?.Length)
            {
                throw new ArgumentException(
                    "Size of 'addChildTags' does not equal size of 'addAtIndices'.",
                    nameof(addChildTags));
            }

            var cssNodeToManage = _shadowNodeRegistry.GetNode(viewTag);

            var numToMove = moveFrom?.Length ?? 0;
            var numToAdd = addChildTags?.Length ?? 0;
            var numToRemove = removeFrom?.Length ?? 0;
            var viewsToAdd = new ViewAtIndex[numToMove + numToAdd];
            var indicesToRemove = new int[numToMove + numToRemove];
            var tagsToRemove = new int[indicesToRemove.Length];
            var tagsToDelete = new int[numToRemove];

            if (numToMove > 0)
            {
                for (var i = 0; i < numToMove; ++i)
                {
                    var moveFromIndex = moveFrom[i];
                    var tagToMove = cssNodeToManage.GetChildAt(i).ReactTag;
                    viewsToAdd[i] = new ViewAtIndex(tagToMove, moveTo[i]);
                    indicesToRemove[i] = moveFromIndex;
                    tagsToRemove[i] = tagToMove;
                }
            }

            if (numToAdd > 0)
            {
                for (var i = 0; i < numToAdd; ++i)
                {
                    viewsToAdd[numToMove + i] = new ViewAtIndex(addChildTags[i], addAtIndices[i]);
                }
            }

            if (numToRemove > 0)
            {
                for (var i = 0; i < numToRemove; ++i)
                {
                    var indexToRemove = removeFrom[i];
                    var tagToRemove = cssNodeToManage.GetChildAt(indexToRemove).ReactTag;
                    indicesToRemove[numToMove + i] = indexToRemove;
                    tagsToRemove[numToMove + i] = tagToRemove;
                    tagsToDelete[i] = tagToRemove;
                }
            }

            // NB: moveFrom and removeForm are both relative to the starting
            // state of the view's children.
            //
            // 1) Sort the views to add and indices to remove by index
            // 2) Iterate the indices being removed from high to low and remove
            //    them. Going high to low makes sure we remove the correct
            //    index when there are multiple to remove.
            // 3) Iterate the views being added by index low to high and add 
            //    them. Like the view removal, iteration direction is important
            //    to preserve the correct index.

            Array.Sort(viewsToAdd, ViewAtIndex.IndexComparer);
            Array.Sort(indicesToRemove);

            // Apply changes to the ReactShadowNode hierarchy.
            var lastIndexRemoved = -1;
            for (var i = indicesToRemove.Length - 1; i >= 0; --i)
            {
                var indexToRemove = indicesToRemove[i];
                if (indexToRemove == lastIndexRemoved)
                {
                    throw new InvalidOperationException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Repeated indices in removal list for view tag '{0}'.",
                            viewTag));
                }

                cssNodeToManage.RemoveChildAt(indexToRemove);
                lastIndexRemoved = indexToRemove;
            }

            for (var i = 0; i < viewsToAdd.Length; ++i)
            {
                var viewAtIndex = viewsToAdd[i];
                var cssNodeToAdd = _shadowNodeRegistry.GetNode(viewAtIndex.Tag);
                if (cssNodeToAdd == null)
                {
                    throw new InvalidOperationException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Trying to add unknown view tag '{0}'.",
                            viewAtIndex.Tag));
                }

                cssNodeToManage.AddChildAt(cssNodeToAdd, viewAtIndex.Index);
            }

            if (!cssNodeToManage.IsVirtual && !cssNodeToManage.IsVirtualAnchor)
            {
                _nativeViewHierarchyOptimizer.HandleManageChildren(
                    cssNodeToManage,
                    indicesToRemove,
                    tagsToRemove,
                    viewsToAdd,
                    tagsToDelete);
            }

            for (var i = 0; i < tagsToDelete.Length; ++i)
            {
                RemoveShadowNode(_shadowNodeRegistry.GetNode(tagsToDelete[i]));
            }
        }

        /// <summary>
        /// Replaces the view specified by <paramref name="oldTag"/> with the
        /// view specified by <paramref name="newTag"/> within
        /// <paramref name="oldTag"/>'s parent.
        /// </summary>
        /// <param name="oldTag">The old tag.</param>
        /// <param name="newTag">The new tag.</param>
        public void ReplaceExistingNonRootView(int oldTag, int newTag)
        {
            if (_shadowNodeRegistry.IsRootNode(oldTag) || _shadowNodeRegistry.IsRootNode(newTag))
            {
                throw new InvalidOperationException("Cannot add or replace a root tag.");
            }

            var oldNode = _shadowNodeRegistry.GetNode(oldTag);
            var parent = oldNode.Parent;
            if (parent == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Node '{0}' is not attached to a parent.",
                        oldTag));
            }

            var oldIndex = parent.IndexOf(oldNode);
            if (oldIndex < 0)
            {
                throw new InvalidOperationException("Did not find child tag in parent.");
            }

            var tagsToAdd = new[] { newTag };
            var addAtIndices = new[] { oldIndex };
            var indicesToRemove = new[] { oldIndex };

            ManageChildren(parent.ReactTag, null, null, tagsToAdd, addAtIndices, indicesToRemove);
        }

        /// <summary>
        /// Method which takes a container tag and then releases all subviews
        /// for that container upon receipt.
        /// </summary>
        /// <param name="containerTag">The container tag.</param>
        public void RemoveSubviewsFromContainerWithID(int containerTag)
        {
            var containerNode = _shadowNodeRegistry.GetNode(containerTag);
            var n = containerNode.ChildCount;
            var indicesToRemove = new int[n];
            for (var i = 0; i < n; ++i)
            {
                indicesToRemove[i] = i;
            }

            ManageChildren(containerTag, null, null, null, null, indicesToRemove);
        }

        /// <summary>
        /// Determines the location on screen, width, and height of the given
        /// view and returns the values via an asynchronous callback.
        /// </summary>
        /// <param name="reactTag">The view tag to measure.</param>
        /// <param name="callback">The callback.</param>
        public void Measure(int reactTag, ICallback callback)
        {
            _operationsQueue.EnqueueMeasure(reactTag, callback);
        }

        /// <summary>
        /// Measures the view specified by <paramref name="tag"/> relative to
        /// the given <paramref name="ancestorTag"/>. This means that the
        /// returned x, y are relative to the origin x, y of the ancestor view.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="ancestorTag">The ancestor tag.</param>
        /// <param name="errorCallback">Called in case of error.</param>
        /// <param name="successCallback">Called with the measurements.</param>
        /// <remarks>
        /// The measure view and ancestor view may be the same, in which case
        /// the x,y result would be 0,0 and the method will return the view
        /// dimensions.
        /// </remarks>
        public void MeasureLayout(int tag, int ancestorTag, ICallback errorCallback, ICallback successCallback)
        {
            try
            {
                MeasureLayout(tag, ancestorTag, _measureBuffer);
                var relativeX = _measureBuffer[0]; // TODO: convert pixels to DIP?
                var relativeY = _measureBuffer[1]; // TODO: convert pixels to DIP?
                var width = _measureBuffer[2]; // TODO: convert pixels to DIP?
                var height = _measureBuffer[3]; // TODO: convert pixels to DIP?
                successCallback.Invoke(relativeX, relativeY, width, height);
            }
            catch (Exception e)
            {
                errorCallback.Invoke(e.Message);
            }
        }

        /// <summary>
        /// Similar to <see cref="Measure(int, ICallback)"/> and 
        /// <see cref="MeasureLayout(int, int, ICallback, ICallback)"/>,
        /// measures relative to the immediate parent.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="errorCallback">Called in case of error.</param>
        /// <param name="successCallback">Called with the measurements.</param>
        public void MeasureLayoutRelativeToParent(int tag, ICallback errorCallback, ICallback successCallback)
        {
            try
            {
                MeasureLayoutRelativeToParent(tag, _measureBuffer);
                var relativeX = _measureBuffer[0]; // TODO: convert pixels to DIP?
                var relativeY = _measureBuffer[1]; // TODO: convert pixels to DIP?
                var width = _measureBuffer[2]; // TODO: convert pixels to DIP?
                var height = _measureBuffer[3]; // TODO: convert pixels to DIP?
                successCallback.Invoke(relativeX, relativeY, width, height);
            }
            catch (Exception e)
            {
                errorCallback.Invoke(e);
            }
        }

        /// <summary>
        /// Invoked at the end of a transaction to commit any updates to the 
        /// node hierarchy.
        /// </summary>
        /// <param name="eventDispatcher">The event dispatcher.</param>
        /// <param name="batchId">The batch identifier.</param>
        public void DispatchViewUpdates(EventDispatcher eventDispatcher, int batchId)
        {
            foreach (var tag in _shadowNodeRegistry.RootNodeTags)
            {
                var cssRoot = _shadowNodeRegistry.GetNode(tag);
                NotifyBeforeOnLayoutRecursive(cssRoot);
                CalculateRootLayout(cssRoot);
                ApplyUpdatesRecursive(cssRoot, 0, 0, eventDispatcher);
            }

            _nativeViewHierarchyOptimizer.OnBatchComplete();
            _operationsQueue.ExecuteOperations(batchId);
        }

        /// <summary>
        /// Sets a JavaScript responder for a view.
        /// </summary>
        /// <param name="reactTag">The view ID.</param>
        /// <param name="blockNativeResponder">
        /// Flag to signal if the native responder should be blocked.
        /// </param>
        public void SetJavaScriptResponder(int reactTag, bool blockNativeResponder)
        {
            AssertViewExists(reactTag);
            var node = _shadowNodeRegistry.GetNode(reactTag);
            while (node.IsVirtual || node.IsLayoutOnly)
            {
                node = node.Parent;
            }

            _operationsQueue.EnqueueSetJavaScriptResponder(node.ReactTag, reactTag, blockNativeResponder);
        }

        /// <summary>
        /// Clears the JavaScript responder.
        /// </summary>
        public void ClearJavaScriptResponder()
        {
            _operationsQueue.EnqueueClearJavaScriptResponder();
        }

        /// <summary>
        /// Dispatches a command to the view manager.
        /// </summary>
        /// <param name="reactTag">The tag of the view manager.</param>
        /// <param name="commandId">The command ID.</param>
        /// <param name="commandArgs">The command arguments.</param>
        public void DispatchViewManagerCommand(int reactTag, int commandId, JArray commandArgs)
        {
            AssertViewExists(reactTag);
            _operationsQueue.EnqueueDispatchCommand(reactTag, commandId, commandArgs);
        }

        /// <summary>
        /// Show a pop-up menu.
        /// </summary>
        /// <param name="reactTag">
        /// The tag of the anchor view (the pop-up menu is displayed next to
        /// this view); this needs to be the tag of a native view (shadow views
        /// cannot be anchors).
        /// </param>
        /// <param name="items">The menu items as an array of strings.</param>
        /// <param name="error">
        /// Callback used if there is an error displaying the menu.
        /// </param>
        /// <param name="success">
        /// Callback used with the position of the selected item as the first
        /// argument, or no arguments if the menu is dismissed.
        /// </param>
        public void ShowPopupMenu(int reactTag, string[] items, ICallback error, ICallback success)
        {
            AssertViewExists(reactTag);
            _operationsQueue.EnqueueShowPopupMenu(reactTag, items, error, success);
        }

        /// <summary>
        /// Called when the host receives the suspend event.
        /// </summary>
        public void OnSuspend()
        {
        }

        /// <summary>
        /// Called when the host receives the resume event.
        /// </summary>
        public void OnResume()
        {
        }

        /// <summary>
        /// Called when the host is shutting down.
        /// </summary>
        public void OnShutdown()
        {
        }

        private void HandleCreateView(ReactShadowNode cssNode, int rootViewTag, ReactStylesDiffMap styles)
        {
            if (!cssNode.IsVirtual)
            {
                _nativeViewHierarchyOptimizer.HandleCreateView(cssNode, cssNode.ThemedContext, styles);
            }
        }

        private void HandleUpdateView(
            ReactShadowNode cssNode,
            string className,
            ReactStylesDiffMap styles)
        {
            if (!cssNode.IsVirtual)
            {
                _nativeViewHierarchyOptimizer.HandleUpdateView(cssNode, className, styles);
            }
        }

        private ReactShadowNode CreateRootShadowNode()
        {
            var rootCssNode = new ReactShadowNode();
            rootCssNode.ViewClass = "Root";
            return rootCssNode;
        }

        private ReactShadowNode CreateShadowNode(string className)
        {
            var viewManager = _viewManagers.Get(className);
            return viewManager.CreateShadowNodeInstance();
        }

        private ReactShadowNode ResolveShadowNode(int reactTag)
        {
            return _shadowNodeRegistry.GetNode(reactTag);
        }

        private ViewManager ResolveViewManager(string className)
        {
            return _viewManagers.Get(className);
        }

        private void RemoveShadowNode(ReactShadowNode nodeToRemove)
        {
            _nativeViewHierarchyOptimizer.HandleRemoveNode(nodeToRemove);
            _shadowNodeRegistry.RemoveNode(nodeToRemove.ReactTag);
            for (var i = nodeToRemove.ChildCount - 1; i >= 0; --i)
            {
                RemoveShadowNode(nodeToRemove.GetChildAt(i));
            }

            nodeToRemove.RemoveAllChildren();
        }

        private void MeasureLayout(int tag, int ancestorTag, int[] outputBuffer)
        {
            var node = _shadowNodeRegistry.GetNode(tag);
            var ancestor = _shadowNodeRegistry.GetNode(ancestorTag);
            if (node == null || ancestor == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Tag '{0}' does not exist.",
                        node == null ? tag : ancestorTag));
            }

            if (node != ancestor)
            {
                var currentParent = node.Parent;
                while (currentParent != ancestor)
                {
                    if (currentParent == null)
                    {
                        throw new InvalidOperationException(
                            string.Format(
                                CultureInfo.InvariantCulture,
                                "Tag '{0}' is not an ancestor of tag '{1}'.",
                                ancestorTag,
                                tag));
                    }

                    currentParent = currentParent.Parent;
                }
            }

            MeasureLayoutRelativeToVerifiedAncestor(node, ancestor, outputBuffer);
        }

        private void MeasureLayoutRelativeToParent(int tag, int[] outputBuffer)
        {
            var node = _shadowNodeRegistry.GetNode(tag);
            if (node == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "No native view for tag '{0}' exists.",
                        tag));
            }

            var parent = node.Parent;
            if (parent == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "View with tag '{0}' does not have a parent.",
                        tag));
            }

            MeasureLayoutRelativeToVerifiedAncestor(node, parent, outputBuffer);
        }

        private void MeasureLayoutRelativeToVerifiedAncestor(
            ReactShadowNode node, 
            ReactShadowNode ancestor, 
            int[] outputBuffer)
        {
            var offsetX = 0;
            var offsetY = 0;
            if (node != ancestor)
            {
                offsetX = (int)Math.Round(node.LayoutX);
                offsetY = (int)Math.Round(node.LayoutY);
                var current = node.Parent;
                while (current != ancestor)
                {
                    Debug.Assert(current != null);
                    AssertNodeDoesNotNeedCustomLayoutForChildren(current);
                    offsetX += (int)Math.Round(current.LayoutX);
                    offsetY += (int)Math.Round(current.LayoutY);
                    current = current.Parent;
                }

                AssertNodeDoesNotNeedCustomLayoutForChildren(ancestor);
            }

            outputBuffer[0] = offsetX;
            outputBuffer[1] = offsetY;
            outputBuffer[2] = node.ScreenWidth;
            outputBuffer[3] = node.ScreenHeight;
        }

        private void AssertViewExists(int reactTag, [CallerMemberName]string caller = null)
        {
            if (_shadowNodeRegistry.GetNode(reactTag) == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Unable to execute operation '{0}' on view with non-existant tag '{1}'.",
                        caller,
                        reactTag));
            }
        }

        private void AssertNodeDoesNotNeedCustomLayoutForChildren(ReactShadowNode node)
        {
            var viewManager = _viewManagers.Get(node.ViewClass);
            if (viewManager == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Could not find view class '{0}'.",
                        node.ViewClass));
            }

            var viewGroupManager = viewManager as ViewGroupManager;
            if (viewGroupManager == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Trying to use view '{0}' as a parent but its manager is not a ViewGroupManager.",
                        node.ViewClass));
            }

            if (viewGroupManager.NeedsCustomLayoutForChildren)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Trying to measure a view using measureLayout/measureLayoutRelativeToParent relative to " +
                        "an ancestor that requires custom layout for it's children ('{0}'). Use measure instead.",
                        node.ViewClass));
            }
        }

        private void NotifyBeforeOnLayoutRecursive(ReactShadowNode cssNode)
        {
            if (!cssNode.HasUpdates)
            {
                return;
            }

            for (var i = 0; i < cssNode.ChildCount; ++i)
            {
                NotifyBeforeOnLayoutRecursive(cssNode.GetChildAt(i));
            }

            cssNode.OnBeforeLayout();
        }

        private void CalculateRootLayout(ReactShadowNode cssRoot)
        {
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "ReactShadowNode.CalculateLayout")
                .With("RootTag", cssRoot.ReactTag))
            {
                cssRoot.CalculateLayout();
            }
        }

        private void ApplyUpdatesRecursive(
            ReactShadowNode cssNode, 
            double absoluteX, 
            double absoluteY, 
            EventDispatcher eventDispatcher)
        {
            if (!cssNode.HasUpdates)
            {
                return;
            }

            if (!cssNode.IsVirtualAnchor)
            {
                for (var i = 0; i < cssNode.ChildCount; ++i)
                {
                    ApplyUpdatesRecursive(
                        cssNode.GetChildAt(i),
                        absoluteX + cssNode.LayoutX,
                        absoluteY + cssNode.LayoutY,
                        eventDispatcher);
                }
            }

            var tag = cssNode.ReactTag;
            if (!_shadowNodeRegistry.IsRootNode(tag))
            {
                cssNode.DispatchUpdates(
                    absoluteX,
                    absoluteY,
                    _operationsQueue,
                    _nativeViewHierarchyOptimizer);

                if (cssNode.ShouldNotifyOnLayout)
                {
                    OnLayoutEvent.Obtain(
                        tag,
                        cssNode.ScreenX,
                        cssNode.ScreenY,
                        cssNode.ScreenWidth,
                        cssNode.ScreenHeight);
                }
            }

            cssNode.MarkUpdateSeen();
        }
    }
}
