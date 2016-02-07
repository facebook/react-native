using Newtonsoft.Json.Linq;
using ReactNative.Animation;
using ReactNative.Bridge;
using ReactNative.Touch;
using ReactNative.Tracing;
using ReactNative.UIManager.LayoutAnimation;
using System;
using System.Collections.Generic;
using System.Globalization;
using Windows.UI.Popups;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Delegate of <see cref="UIManagerModule"/> that owns the native view
    /// hierarchy and mapping between native view names used in JavaScript and
    /// corresponding instances of <see cref="ViewManager"/>. The 
    /// <see cref="UIManagerModule"/> communicates with this class by it's
    /// public interface methods:
    /// - <see cref="UpdateProperties(int, string, CatalystStylesDiffMap)"/>
    /// - <see cref="UpdateLayout(int, int, int, int, int, int)"/>
    /// - <see cref="CreateView(ThemedReactContext, int, string, CatalystStylesDiffMap)"/>
    /// - <see cref="ManageChildren(int, int[], ViewAtIndex[], int[])"/>
    /// executing all the scheduled operations at the end of the JavaScript batch.
    /// </summary>
    /// <remarks>
    /// All native view management methods listed above must be called from the
    /// dispatcher thread.
    /// 
    /// The <see cref="ReactContext"/> instnace that is passed to views that
    /// this manager creates differs from the one that we pass to the
    /// constructor. Instead we wrap the provided instance of 
    /// <see cref="ReactContext"/> in an instance of <see cref="ThemedReactContext"/>
    /// that additionally provides a correct theme based on the root view for
    /// a view tree that we attach newly created views to. Therefore this view
    /// manager will create a copy of <see cref="ThemedReactContext"/> that
    /// wraps the instance of <see cref="ReactContext"/> for each root view
    /// added to the manager (see
    /// <see cref="AddRootView(int, SizeMonitoringCanvas, ThemedReactContext)"/>).
    /// 
    /// TODO: 
    /// 1) AnimationRegistry
    /// 2) UpdateLayout
    /// 3) Measure
    /// 4) ShowPopupMenu
    /// </remarks>
    public class NativeViewHierarchyManager
    {
        private readonly IDictionary<int, ViewManager> _tagsToViewManagers;
        private readonly IDictionary<int, FrameworkElement> _tagsToViews;
        private readonly IDictionary<int, bool> _rootTags;
        private readonly ViewManagerRegistry _viewManagers;
        private readonly JavaScriptResponderHandler _jsResponderHandler;
        private readonly RootViewManager _rootViewManager;
        private readonly AnimationRegistry _animationRegistry;
        private readonly LayoutAnimationManager _LayoutAnimator;

        /// <summary>
        /// Instantiates the <see cref="NativeViewHierarchyManager"/>.
        /// </summary>
        /// <param name="viewManagers">The view manager registry.</param>
        public NativeViewHierarchyManager(ViewManagerRegistry viewManagers)
        {
            _viewManagers = viewManagers;
            _LayoutAnimator = new LayoutAnimationManager();
            _tagsToViews = new Dictionary<int, FrameworkElement>();
            _tagsToViewManagers = new Dictionary<int, ViewManager>();
            _rootTags = new Dictionary<int, bool>();
            _jsResponderHandler = new JavaScriptResponderHandler();
            _rootViewManager = new RootViewManager();
            _animationRegistry = new AnimationRegistry();
        }

        /// <summary>
        /// The animation registry.
        /// </summary>
        public AnimationRegistry AnimationRegistry
        {
            get
            {
                return _animationRegistry;
            }
        }

        /// <summary>
        /// Signals if layout animation is enabled.
        /// </summary>
        public bool LayoutAnimationEnabled
        {
            private get;
            set;
        }

        /// <summary>
        /// Begins the animation timeline(s) binded to the <see cref="AnimationManager"/>.
        /// </summary>
        /// <param name="reactTag">The ID of the native view to animate</param>
        /// <param name="animation">The <see cref="AnimationManager"/> to use for animating a <see cref="FrameworkElement"/>.</param>
        /// <param name="callback">The final callback function that's invoked once the animation is complete.</param>
        public void BeginAnimation(int reactTag, AnimationManager animation, ICallback callback)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var viewToAnimate = ResolveView(reactTag);
            int animationId = animation.AnimationId;
            
        }

        /// <summary>
        /// Updates the properties of the view with the given tag.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="properties">The properties.</param>
        public void UpdateProperties(int tag, CatalystStylesDiffMap properties)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var viewManager = ResolveViewManager(tag);
            var viewToUpdate = ResolveView(tag);
            viewManager.UpdateProperties(viewToUpdate, properties);
        }

        /// <summary>
        /// Updates the extra data for the view with the given tag.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="extraData">The extra data.</param>
        public void UpdateViewExtraData(int tag, object extraData)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var viewManager = ResolveViewManager(tag);
            var viewToUpdate = ResolveView(tag);
            viewManager.UpdateExtraData(viewToUpdate, extraData);
        }

        /// <summary>
        /// Updates the layout of a view.
        /// </summary>
        /// <param name="parentTag">The parent view tag.</param>
        /// <param name="tag">The view tag.</param>
        /// <param name="x">The left coordinate.</param>
        /// <param name="y">The right coordinate.</param>
        /// <param name="width">The layout width.</param>
        /// <param name="height">The layout height.</param>
        public void UpdateLayout(int parentTag, int tag, int x, int y, int width, int height)
        {
            DispatcherHelpers.AssertOnDispatcher();
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_VIEW, "NativeViewHierarcyManager.UpdateLayout")
                .With("parentTag", parentTag)
                .With("tag", tag))
            {
                var viewToUpdate = ResolveView(tag);
                
                var parentViewManager = default(ViewManager);
                var parentViewGroupManager = default(ViewGroupManager);
                if (!_tagsToViewManagers.TryGetValue(parentTag, out parentViewManager) || 
                    (parentViewGroupManager = parentViewManager as ViewGroupManager) == null)
                {
                    throw new InvalidOperationException(
                        string.Format(
                            CultureInfo.InvariantCulture,
                            "Trying to use view with tag '{0}' as a parent, but its manager doesn't extend ViewGroupManager.",
                            tag));
                }

                if (!parentViewGroupManager.NeedsCustomLayoutForChildren)
                {
                    UpdateLayout(viewToUpdate, x, y, width, height);
                }
            }
        }

        /// <summary>
        /// Creates a view with the given tag and class name.
        /// </summary>
        /// <param name="themedContext">The context.</param>
        /// <param name="tag">The tag.</param>
        /// <param name="className">The class name.</param>
        /// <param name="initialProperties">The properties.</param>
        public void CreateView(ThemedReactContext themedContext, int tag, string className, CatalystStylesDiffMap initialProperties)
        {
            DispatcherHelpers.AssertOnDispatcher();
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_VIEW, "NativeViewHierarcyManager.CreateView")
                .With("tag", tag)
                .With("className", className))
            {
                var viewManager = _viewManagers.Get(className);
                var view = viewManager.CreateView(themedContext, _jsResponderHandler);
                _tagsToViews.Add(tag, view);
                _tagsToViewManagers.Add(tag, viewManager);

                // Uses an extension method and `Tag` property on 
                // FrameworkElement to store the tag of the view.
                view.SetTag(tag);
                view.SetReactContext(themedContext);

                if (initialProperties != null)
                {
                    viewManager.UpdateProperties(view, initialProperties);
                }
            }
        }

        /// <summary>
        /// Sets up the Layout Animation Manager.
        /// </summary>
        /// <param name="config"></param>
        /// <param name="success"></param>
        /// <param name="error"></param>
        internal void ConfigureLayoutAnimation(JObject config, ICallback success, ICallback error)
        {
            _LayoutAnimator.InitializeFromConfig(config);
        }

        public void ClearLayoutAnimation()
        {
            _LayoutAnimator.Reset();
        }

        /// <summary>
        /// Manages the children of a react view.
        /// </summary>
        /// <param name="tag">The tag of the view to manager.</param>
        /// <param name="indicesToRemove">Child indices to remove.</param>
        /// <param name="viewsToAdd">Views to add.</param>
        /// <param name="tagsToDelete">Tags to delete.</param>
        public void ManageChildren(int tag, int[] indicesToRemove, ViewAtIndex[] viewsToAdd, int[] tagsToDelete)
        {
            var viewManager = default(ViewManager);
            if (!_tagsToViewManagers.TryGetValue(tag, out viewManager))
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Trying to manage children with tag '{0}' which doesn't exist.",
                        tag));
            }

            var viewGroupManager = (ViewGroupManager)viewManager;
            var viewToManage = _tagsToViews[tag];

            var lastIndexToRemove = viewGroupManager.GetChildCount(viewToManage);
            if (indicesToRemove != null)
            {
                for (var i = indicesToRemove.Length - 1; i >= 0; --i)
                {
                    var indexToRemove = indicesToRemove[i];
                    if (indexToRemove < 0)
                    {
                        throw new InvalidOperationException(
                            string.Format(
                                CultureInfo.InvariantCulture,
                                "Trying to remove a negative index '{0}' on view tag '{1}'.",
                                indexToRemove,
                                tag));
                    }

                    if (indexToRemove >= viewGroupManager.GetChildCount(viewToManage))
                    {
                        throw new InvalidOperationException(
                            string.Format(
                                CultureInfo.InvariantCulture,
                                "Trying to remove a view index '{0}' greater than the child could for view tag '{1}'.",
                                indexToRemove,
                                tag));
                    }

                    if (indexToRemove >= lastIndexToRemove)
                    {
                        throw new InvalidOperationException(
                            string.Format(
                                CultureInfo.InvariantCulture,
                                "Trying to remove an out of order index '{0}' (last index was '{1}') for view tag '{2}'.",
                                indexToRemove,
                                lastIndexToRemove,
                                tag));
                    }

                    viewGroupManager.RemoveChildAt(viewToManage, indexToRemove);
                    lastIndexToRemove = indexToRemove;
                }
            }

            if (viewsToAdd != null)
            {
                for (var i = 0; i < viewsToAdd.Length; ++i)
                {
                    var viewAtIndex = viewsToAdd[i];
                    var viewToAdd = default(FrameworkElement);
                    if (!_tagsToViews.TryGetValue(viewAtIndex.Tag, out viewToAdd))
                    {
                        throw new InvalidOperationException(
                            string.Format(
                                CultureInfo.InvariantCulture,
                                "Trying to add unknown view tag '{0}'.",
                                viewAtIndex.Tag));
                    }

                    viewGroupManager.AddView(viewToManage, viewToAdd, viewAtIndex.Index);
                }
            }

            if (tagsToDelete != null)
            {
                for (var i = 0; i < tagsToDelete.Length; ++i)
                {
                    var tagToDelete = tagsToDelete[i];
                    var viewToDestroy = default(FrameworkElement);
                    if (!_tagsToViews.TryGetValue(tagToDelete, out viewToDestroy))
                    {
                        throw new InvalidOperationException(
                            string.Format(
                                CultureInfo.InvariantCulture,
                                "Trying to destroy unknown view tag '{0}'.",
                                tagToDelete));
                    }

                    DropView(viewToDestroy);
                }
            }
        }

        /// <summary>
        /// Remove the root view with the given tag.
        /// </summary>
        /// <param name="rootViewTag">The root view tag.</param>
        public void RemoveRootView(int rootViewTag)
        {
            DispatcherHelpers.AssertOnDispatcher();
            if (!_rootTags.ContainsKey(rootViewTag))
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "View with tag '{0}' is not registered as a root view.",
                        rootViewTag));
            }

            var rootView = _tagsToViews[rootViewTag];
            var sizeMonitoringPanel = rootView as SizeMonitoringCanvas;
            if (sizeMonitoringPanel != null)
            {
                sizeMonitoringPanel.RemoveSizeChanged();
            }

            DropView(rootView);
            _rootTags.Remove(rootViewTag);
        }

        /// <summary>
        /// Measures a view and sets the output buffer to (x, y, width, height).
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="outputBuffer">The output buffer.</param>
        public void Measure(int tag, int[] outputBuffer)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var v = default(FrameworkElement);
            if (!_tagsToViews.TryGetValue(tag, out v))
            {
                throw new ArgumentOutOfRangeException(nameof(tag));
            }

            var rootView = (FrameworkElement)RootViewHelper.GetRootView(v);
            if (rootView == null)
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Native view '{0}' is no longer on screen.",
                        tag));
            }

            //TODO: implement get position, etc.
            throw new NotImplementedException();
        }

        /// <summary>
        /// Adds a root view with the given tag.
        /// </summary>
        /// <param name="tag">The tag.</param>
        /// <param name="view">The root view.</param>
        /// <param name="themedContext">The themed context.</param>
        public void AddRootView(int tag, SizeMonitoringCanvas view, ThemedReactContext themedContext)
        {
            AddRootViewGroup(tag, view, themedContext);
        }

        /// <summary>
        /// Find the view target for touch coordinates.
        /// </summary>
        /// <param name="reactTag">The view tag.</param>
        /// <param name="touchX">The x-coordinate of the touch event.</param>
        /// <param name="touchX">The y-coordinate of the touch event.</param>
        /// <returns>The view target.</returns>
        public int FindTargetForTouch(int reactTag, double touchX, double touchY)
        {
            var view = default(FrameworkElement);
            if (!_tagsToViews.TryGetValue(reactTag, out view))
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Could not find view with tag '{0}'.",
                        reactTag));
            }

            return TouchTargetHelper.FindTargetTagForTouch(touchX, touchY, (Panel)view);
        }

        /// <summary>
        /// Sets the JavaScript responder handler for a view.
        /// </summary>
        /// <param name="reactTag">The view tag.</param>
        /// <param name="initialReactTag">The initial tag.</param>
        /// <param name="blockNativeResponder">
        /// Flag to block the native responder.
        /// </param>
        public void SetJavaScriptResponder(int reactTag, int initialReactTag, bool blockNativeResponder)
        {
            if (!blockNativeResponder)
            {
                _jsResponderHandler.SetJavaScriptResponder(initialReactTag, null);
                return;
            }

            throw new NotImplementedException();
        }

        /// <summary>
        /// Clears the JavaScript responder.
        /// </summary>
        public void ClearJavaScriptResponder()
        {
            _jsResponderHandler.ClearJavaScriptResponder();
        }

        /// <summary>
        /// Dispatches a command to a view.
        /// </summary>
        /// <param name="reactTag">The view tag.</param>
        /// <param name="commandId">The command identifier.</param>
        /// <param name="args">The command arguments.</param>
        public void DispatchCommand(int reactTag, int commandId, JArray args)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var view = default(FrameworkElement);
            if (!_tagsToViews.TryGetValue(reactTag, out view))
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Trying to send command to a non-existent view with tag '{0}.",
                        reactTag));
            }

            var viewManager = ResolveViewManager(reactTag);
            viewManager.ReceiveCommand(view, commandId, args);
        }

        /// <summary>
        /// Shows a <see cref="PopupMenu"/>.
        /// </summary>
        /// <param name="tag">
        /// The tag of the anchor view (the <see cref="PopupMenu"/> is
        /// displayed next to this view); this needs to be the tag of a native
        /// view (shadow views cannot be anchors).
        /// </param>
        /// <param name="items">The menu items as an array of strings.</param>
        /// <param name="success">
        /// A callback used with the position of the selected item as the first
        /// argument, or no arguments if the menu is dismissed.
        /// </param>
        public void ShowPopupMenu(int tag, string[] items, ICallback success)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var view = ResolveView(tag);

            var menu = new PopupMenu();
            for (var i = 0; i < items.Length; ++i)
            {
                menu.Commands.Add(new UICommand(
                    items[i],
                    cmd =>
                    {
                        success.Invoke(cmd.Id);
                    },
                    i));
            }

            // TODO: figure out where to popup the menu
            // TODO: add continuation that calls the callback with empty args
            throw new NotImplementedException();
        }

        private FrameworkElement ResolveView(int tag)
        {
            var view = default(FrameworkElement);
            if (!_tagsToViews.TryGetValue(tag, out view))
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Trying to resolve view with tag '{0}' which doesn't exist.",
                        tag));
            }

            return view;
        }

        private ViewManager ResolveViewManager(int tag)
        {
            var viewManager = default(ViewManager);
            if (!_tagsToViewManagers.TryGetValue(tag, out viewManager))
            {
                throw new InvalidOperationException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "ViewManager for tag '{0}' could not be found.",
                        tag));
            }

            return viewManager;
        }

        private void AddRootViewGroup(int tag, FrameworkElement view, ThemedReactContext themedContext)
        {
            DispatcherHelpers.AssertOnDispatcher();
            _tagsToViews.Add(tag, view);
            _tagsToViewManagers.Add(tag, _rootViewManager);
            _rootTags.Add(tag, true);
            view.SetTag(tag);
            view.SetReactContext(themedContext);
        }

        private void DropView(FrameworkElement view)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var tag = view.GetTag();
            if (!_rootTags.ContainsKey(tag))
            {
                // For non-root views, we notify the view manager with `OnDropViewInstance`
                var mgr = ResolveViewManager(tag);
                mgr.OnDropViewInstance(view.GetReactContext(), view);
            }

            var viewManager = default(ViewManager);
            if (_tagsToViewManagers.TryGetValue(tag, out viewManager))
            {
                var viewGroupManager = viewManager as ViewGroupManager;
                if (viewGroupManager != null)
                {
                    for (var i = viewGroupManager.GetChildCount(view) - 1; i >= 0; --i)
                    {
                        var child = viewGroupManager.GetChildAt(view, i);
                        var managedChild = default(FrameworkElement);
                        if (_tagsToViews.TryGetValue(child.GetTag(), out managedChild))
                        {
                            DropView(managedChild);
                        }
                    }
                }

                viewGroupManager.RemoveAllChildren(view);
            }

            _tagsToViews.Remove(tag);
            _tagsToViewManagers.Remove(tag);
        }

        private void UpdateLayout(FrameworkElement viewToUpdate, int x, int y, int width, int height)
        {
            if (_LayoutAnimator.ShouldAnimateLayout(viewToUpdate))
            {
                _LayoutAnimator.ApplyLayoutUpdate(viewToUpdate, x, y, width, height);
            }
            else
            {
                viewToUpdate.Width = width;
                viewToUpdate.Height = height;
                Canvas.SetLeft(viewToUpdate, x);
                Canvas.SetTop(viewToUpdate, y);
            }

        }
    }
}
