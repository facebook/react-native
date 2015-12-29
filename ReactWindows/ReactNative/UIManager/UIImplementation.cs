using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.CSSLayout;
using ReactNative.Tracing;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Runtime.CompilerServices;

namespace ReactNative.UIManager
{
    /// <summary>
    /// An class that is used to receive React commands from JavaScript and 
    /// translate them into a shadow node hierarchy that is then mapped to a
    /// native view hierarchy.
    /// 
    /// TODOS
    /// 1. CSSLayoutContext
    /// 2. View registration for root and children
    /// 3. Shadow DOM item updates
    /// 4. Animation support
    /// </summary>
    public class UIImplementation
    {
        private readonly ViewManagerRegistry _viewManagers;
        private readonly UIViewOperationQueue _operationsQueue;
        private readonly ShadowNodeRegistry _shadowNodeRegistry;
        private readonly NativeViewHierarchyOptimizer _nativeViewHierarchyOptimizer;
        private readonly CSSLayoutContext _layoutContext; 

        /// <summary>
        /// Instantiates the <see cref="UIImplementation"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="viewManagers">The view managers.</param>
        public UIImplementation(ReactApplicationContext reactContext, IReadOnlyList<IViewManager> viewManagers)
            : this(reactContext, new ViewManagerRegistry(viewManagers))
        {
        }

        private UIImplementation(ReactApplicationContext reactContext, ViewManagerRegistry viewManagers)
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
            SizeMonitoringFrameLayout rootView,
            int tag,
            int width,
            int height,
            ThemedReactContext context)
        {
            var rootCssNode = CreateRootShadowNode();
            rootCssNode.ReactTag = tag;
            rootCssNode.StyleWidth = width;
            rootCssNode.StyleHeight = height;
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
            rootCssNode.StyleWidth = newWidth;
            rootCssNode.StyleHeight = newHeight;

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
            cssNode.ViewClassName = className;
            cssNode.RootNode = rootNode;
            cssNode.ThemedContext = rootNode.ThemedContext;

            _shadowNodeRegistry.AddNode(cssNode);

            var styles = default(CatalystStylesDiffMap);
            if (properties != null)
            {
                styles = new CatalystStylesDiffMap(properties);
                cssNode.UpdateProperties(styles);
            }

            HandleCreateView(cssNode, rootViewTag, styles);
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
                var styles = new CatalystStylesDiffMap(properties);
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
            var children = cssNodeToManage.Children;

            var numToMove = moveFrom?.Length ?? 0;
            var numToAdd = addChildTags?.Length ?? 0;
            var numToRemove = removeFrom?.Length ?? 0;
            var viewsToAdd = new ViewAtIndex[numToMove + numToAdd];
            var indicesToRemove = new int[numToMove + numToRemove];
            var tagsToRemove = new int[addAtIndices.Length];
            var tagsToDelete = new int[numToRemove];

            if (numToMove > 0)
            {
                for (var i = 0; i < numToMove; ++i)
                {
                    var moveFromIndex = moveFrom[i];
                    var tagToMove = children[moveFromIndex].ReactTag;
                    viewsToAdd[i] = new ViewAtIndex(tagToMove, moveTo[i]);
                    indicesToRemove[i] = moveFromIndex;
                    tagsToRemove[i] = tagToMove;
                }
            }

            if (numToAdd > 0)
            {
                for (var i = 0; i < numToRemove; ++i)
                {
                    viewsToAdd[numToMove + i] = new ViewAtIndex(addChildTags[i], addAtIndices[i]);
                }
            }

            if (numToRemove > 0)
            {
                for (var i = 0; i < numToRemove; ++i)
                {
                    var indexToRemove = removeFrom[i];
                    var tagToRemove = children[indexToRemove].ReactTag;
                    indicesToRemove[numToRemove + i] = indexToRemove;
                    tagsToRemove[numToRemove + i] = tagToRemove;
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

            Array.Sort(viewsToAdd, ViewAtIndex.Comparer);
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

                children.RemoveAt(indexToRemove);
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

                children.Insert(viewAtIndex.Index, cssNodeToAdd);
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
            var n = containerNode.Children.Count;
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

        internal void MeasureLayout(int tag, int ancestorTag, ICallback errorCallback, ICallback successCallback)
        {
            // TODO
            throw new NotImplementedException();
        }

        internal void MeasureLayoutRelativeToParent(int tag, ICallback errorCallback, ICallback successCallback)
        {
            // TODO
            throw new NotImplementedException();
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
            _operationsQueue.DispatchViewUpdates(batchId);
        }

        internal void ConfigureNextLayoutAnimation(Dictionary<string, object> config, ICallback success, ICallback error)
        {
            // TODO
            throw new NotImplementedException();
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
            _operationsQueue.EnqueueDispatchViewManagerCommand(reactTag, commandId, commandArgs);
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
        public void ShowPopupMenu(int reactTag, JArray items, ICallback error, ICallback success)
        {
            AssertViewExists(reactTag);
            _operationsQueue.EnqueueShowPopupMenu(reactTag, items, error, success);
        }

        /// <summary>
        /// Called when the host receives the suspend event.
        /// </summary>
        public void OnSuspend()
        {
            _operationsQueue.SuspendFrameCallback();
        }

        /// <summary>
        /// Called when the host receives the resume event.
        /// </summary>
        public void OnResume()
        {
            _operationsQueue.ResumeFrameCallback();
        }

        /// <summary>
        /// Called when the host is shutting down.
        /// </summary>
        public void OnShutdown()
        {
        }

        private void HandleCreateView(ReactShadowNode cssNode, int rootViewTag, CatalystStylesDiffMap styles)
        {
            if (!cssNode.IsVirtual)
            {
                _nativeViewHierarchyOptimizer.HandleCreateView(cssNode, cssNode.ThemedContext, styles);
            }
        }

        private void HandleUpdateView(
            ReactShadowNode cssNode,
            string className,
            CatalystStylesDiffMap styles)
        {
            if (!cssNode.IsVirtual)
            {
                _nativeViewHierarchyOptimizer.HandleUpdateView(cssNode, className, styles);
            }
        }

        private ReactShadowNode CreateRootShadowNode()
        {
            var rootCssNode = new ReactShadowNode();
            rootCssNode.ViewClassName = "Root";
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

        private void RemoveShadowNode(ReactShadowNode nodeToRemove)
        {
            _nativeViewHierarchyOptimizer.HandleRemoveNode(nodeToRemove);
            _shadowNodeRegistry.RemoveNode(nodeToRemove.ReactTag);
            foreach (var child in nodeToRemove.Children)
            {
                RemoveShadowNode(child);
            }

            nodeToRemove.Children.Clear();
        }

        private IViewManager ResolveViewManager(string className)
        {
            return _viewManagers.Get(className);
        }

        private void NotifyBeforeOnLayoutRecursive(ReactShadowNode cssNode)
        {
            foreach (var child in cssNode.Children)
            {
                NotifyBeforeOnLayoutRecursive(child);
            }

            cssNode.OnBeforeLayout();
        }

        private void CalculateRootLayout(ReactShadowNode cssRoot)
        {
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "ReactShadowNode.CalculateLayout")
                .With("RootTag", cssRoot.ReactTag))
            {
                cssRoot.CalculateLayout(_layoutContext);
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
                foreach (var child in cssNode.Children)
                {
                    ApplyUpdatesRecursive(
                        child,
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
                    eventDispatcher,
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

        private void AssertViewExists(int reactTag, [CallerMemberName]string caller = null)
        {
            throw new NotImplementedException();
        }
    }
}
