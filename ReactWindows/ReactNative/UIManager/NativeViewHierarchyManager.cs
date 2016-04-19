using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Touch;
using ReactNative.Tracing;
using ReactNative.UIManager.LayoutAnimation;
using System;
using System.Collections.Generic;
using Windows.Foundation;
using Windows.UI.Popups;
using Windows.UI.Xaml;
using Windows.UI.Xaml.Controls;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Delegate of <see cref="UIManagerModule"/> that owns the native view
    /// hierarchy and mapping between native view names used in JavaScript and
    /// corresponding instances of <see cref="IViewManager"/>. The 
    /// <see cref="UIManagerModule"/> communicates with this class by it's
    /// public interface methods:
    /// - <see cref="UpdateProperties(int, ReactStylesDiffMap)"/>
    /// - <see cref="UpdateLayout(int, int, int, int, int, int)"/>
    /// - <see cref="CreateView(ThemedReactContext, int, string, ReactStylesDiffMap)"/>
    /// - <see cref="ManageChildren(int, int[], ViewAtIndex[], int[])"/>
    /// executing all the scheduled operations at the end of the JavaScript batch.
    /// </summary>
    /// <remarks>
    /// All native view management methods listed above must be called from the
    /// dispatcher thread.
    /// 
    /// The <see cref="ReactContext"/> instance that is passed to views that
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
    /// 2) ShowPopupMenu
    /// </remarks>
    public class NativeViewHierarchyManager
    {
        private readonly IDictionary<int, IViewManager> _tagsToViewManagers;
        private readonly IDictionary<int, FrameworkElement> _tagsToViews;
        private readonly IDictionary<int, bool> _rootTags;
        private readonly ViewManagerRegistry _viewManagers;
        private readonly JavaScriptResponderHandler _jsResponderHandler;
        private readonly RootViewManager _rootViewManager;
        private readonly LayoutAnimationController _layoutAnimator;

        /// <summary>
        /// Instantiates the <see cref="NativeViewHierarchyManager"/>.
        /// </summary>
        /// <param name="viewManagers">The view manager registry.</param>
        public NativeViewHierarchyManager(ViewManagerRegistry viewManagers)
        {
            _viewManagers = viewManagers;
            _layoutAnimator = new LayoutAnimationController();
            _tagsToViews = new Dictionary<int, FrameworkElement>();
            _tagsToViewManagers = new Dictionary<int, IViewManager>();
            _rootTags = new Dictionary<int, bool>();
            _jsResponderHandler = new JavaScriptResponderHandler();
            _rootViewManager = new RootViewManager();
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
        /// Updates the properties of the view with the given tag.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="props">The properties.</param>
        public void UpdateProperties(int tag, ReactStylesDiffMap props)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var viewManager = ResolveViewManager(tag);
            var viewToUpdate = ResolveView(tag);
            viewManager.UpdateProperties(viewToUpdate, props);
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
        /// <param name="y">The top coordinate.</param>
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
                
                var parentViewManager = default(IViewManager);
                var parentViewParentManager = default(IViewParentManager);
                if (!_tagsToViewManagers.TryGetValue(parentTag, out parentViewManager) || 
                    (parentViewParentManager = parentViewManager as IViewParentManager) == null)
                {
                    throw new InvalidOperationException(
                        $"Trying to use view with tag '{tag}' as a parent, but its manager doesn't extend ViewParentManager.");
                }

                if (!parentViewParentManager.NeedsCustomLayoutForChildren)
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
        public void CreateView(ThemedReactContext themedContext, int tag, string className, ReactStylesDiffMap initialProperties)
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
        public void ConfigureLayoutAnimation(JObject config, ICallback success, ICallback error)
        {
            _layoutAnimator.InitializeFromConfig(config);
        }

        /// <summary>
        /// Clears out the <see cref="LayoutAnimationController"/>.
        /// </summary>
        public void ClearLayoutAnimation()
        {
            _layoutAnimator.Reset();
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
            var viewManager = default(IViewManager);
            if (!_tagsToViewManagers.TryGetValue(tag, out viewManager))
            {
                throw new InvalidOperationException(
                    $"Trying to manage children with tag '{tag}' which doesn't exist.");
            }

            var viewParentManager = (IViewParentManager)viewManager;
            var viewToManage = _tagsToViews[tag];

            var lastIndexToRemove = viewParentManager.GetChildCount(viewToManage);
            if (indicesToRemove != null)
            {
                for (var i = indicesToRemove.Length - 1; i >= 0; --i)
                {
                    var indexToRemove = indicesToRemove[i];
                    if (indexToRemove < 0)
                    {
                        throw new InvalidOperationException(
                            $"Trying to remove a negative index '{indexToRemove}' on view tag '{tag}'.");
                    }

                    if (indexToRemove >= viewParentManager.GetChildCount(viewToManage))
                    {
                        throw new InvalidOperationException(
                            $"Trying to remove a view index '{indexToRemove}' greater than the child could for view tag '{tag}'.");
                    }

                    if (indexToRemove >= lastIndexToRemove)
                    {
                        throw new InvalidOperationException(
                            $"Trying to remove an out of order index '{indexToRemove}' (last index was '{lastIndexToRemove}') for view tag '{tag}'.");
                    }

                    viewParentManager.RemoveChildAt(viewToManage, indexToRemove);
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
                            $"Trying to add unknown view tag '{viewAtIndex.Tag}'.");
                    }

                    viewParentManager.AddView(viewToManage, viewToAdd, viewAtIndex.Index);
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
                            $"Trying to destroy unknown view tag '{tagToDelete}'.");
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
                    $"View with tag '{rootViewTag}' is not registered as a root view.");
            }

            var rootView = _tagsToViews[rootViewTag];
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

            var rootView = RootViewHelper.GetRootView(v);
            if (rootView == null)
            {
                throw new InvalidOperationException(
                    $"Native view '{tag}' is no longer on screen.");
            }

            // TODO: better way to get relative position?
            var rootTransform = v.TransformToVisual(rootView);
            var positionInRoot = rootTransform.TransformPoint(new Point(0, 0));

            outputBuffer[0] = (int)Math.Round(positionInRoot.X);
            outputBuffer[1] = (int)Math.Round(positionInRoot.Y);
            outputBuffer[2] = (int)Math.Round(v.Width);
            outputBuffer[3] = (int)Math.Round(v.Height);
        }

        /// <summary>
        /// Adds a root view with the given tag.
        /// </summary>
        /// <param name="tag">The tag.</param>
        /// <param name="view">The root view.</param>
        /// <param name="themedContext">The themed context.</param>
        public void AddRootView(int tag, SizeMonitoringCanvas view, ThemedReactContext themedContext)
        {
            AddRootViewParent(tag, view, themedContext);
        }

        /// <summary>
        /// Find the view target for touch coordinates.
        /// </summary>
        /// <param name="reactTag">The view tag.</param>
        /// <param name="touchX">The x-coordinate of the touch event.</param>
        /// <param name="touchY">The y-coordinate of the touch event.</param>
        /// <returns>The view target.</returns>
        public int FindTargetForTouch(int reactTag, double touchX, double touchY)
        {
            var view = default(FrameworkElement);
            if (!_tagsToViews.TryGetValue(reactTag, out view))
            {
                throw new InvalidOperationException(
                    $"Could not find view with tag '{reactTag}'.");
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

            var view = default(FrameworkElement);
            if (!_tagsToViews.TryGetValue(reactTag, out view))
            {
                throw new InvalidOperationException(
                    $"Could not find view with tag '{reactTag}'.");
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
                    $"Trying to send command to a non-existent view with tag '{reactTag}.");
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
                    $"Trying to resolve view with tag '{tag}' which doesn't exist.");
            }

            return view;
        }

        private IViewManager ResolveViewManager(int tag)
        {
            var viewManager = default(IViewManager);
            if (!_tagsToViewManagers.TryGetValue(tag, out viewManager))
            {
                throw new InvalidOperationException(
                    $"ViewManager for tag '{tag}' could not be found.");
            }

            return viewManager;
        }

        private void AddRootViewParent(int tag, FrameworkElement view, ThemedReactContext themedContext)
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

            var viewManager = default(IViewManager);
            if (_tagsToViewManagers.TryGetValue(tag, out viewManager))
            {
                var viewParentManager = viewManager as IViewParentManager;
                if (viewParentManager != null)
                {
                    for (var i = viewParentManager.GetChildCount(view) - 1; i >= 0; --i)
                    {
                        var child = viewParentManager.GetChildAt(view, i);
                        var managedChild = default(FrameworkElement);
                        if (_tagsToViews.TryGetValue(child.GetTag(), out managedChild))
                        {
                            DropView(managedChild);
                        }
                    }

                    viewParentManager.RemoveAllChildren(view);
                }
            }

            _tagsToViews.Remove(tag);
            _tagsToViewManagers.Remove(tag);
        }

        private void UpdateLayout(FrameworkElement viewToUpdate, int x, int y, int width, int height)
        {
            var layoutManager = default(ILayoutManager);
            if (_layoutAnimator.ShouldAnimateLayout(viewToUpdate))
            {
                _layoutAnimator.ApplyLayoutUpdate(viewToUpdate, x, y, width, height);
            }
            else if ((layoutManager = viewToUpdate as ILayoutManager) != null)
            {
                layoutManager.UpdateLayout(x, y, width, height);
            }
            else
            {
                Canvas.SetLeft(viewToUpdate, x);
                Canvas.SetTop(viewToUpdate, y);
                viewToUpdate.Width = width;
                viewToUpdate.Height = height;
            }
        }
    }
}
