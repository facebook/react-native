using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.Tracing;
using System;
using System.Collections.Generic;
using System.Globalization;
using Windows.UI.Xaml;

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
    /// <see cref="AddRootView(int, SizeMonitoringFrameLayout, ThemedReactContext)"/>).
    /// 
    /// TODO: 
    /// 1) AnimationRegistry
    /// </remarks>
    public class NativeViewHierarchyManager
    {
        private readonly IDictionary<int, IViewManager> _tagsToViewManagers;
        private readonly IDictionary<int, FrameworkElement> _tagsToViews;
        private readonly IDictionary<int, bool> _rootTags;
        private readonly ViewManagerRegistry _viewManagers;
        private readonly JavaScriptResponderHandler _jsResponderHandler;
        private readonly RootViewManager _rootViewManager;

        public NativeViewHierarchyManager(ViewManagerRegistry viewManagers)
        {
            _viewManagers = viewManagers;
            _tagsToViews = new Dictionary<int, FrameworkElement>();
            _tagsToViewManagers = new Dictionary<int, IViewManager>();
            _rootTags = new Dictionary<int, bool>();
            _jsResponderHandler = new JavaScriptResponderHandler();
            _rootViewManager = new RootViewManager();
        }

        public void UpdateProperties(int tag, string className, CatalystStylesDiffMap properties)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var viewManager = ResolveViewManager(tag);
            var viewToUpdate = ResolveView(tag);
            viewManager.UpdateProperties(viewToUpdate, properties);
        }

        public void UpdateViewExtraData(int tag, object data)
        {
            DispatcherHelpers.AssertOnDispatcher();
            var viewManager = ResolveViewManager(tag);
            var viewToUpdate = ResolveView(tag);
            viewManager.UpdateExtraData(viewToUpdate, data);
        }

        public void UpdateLayout(int parentTag, int tag, int x, int y, int width, int height)
        {
            DispatcherHelpers.AssertOnDispatcher();
            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_VIEW, "NativeViewHierarcyManager.UpdateLayout")
                .With("parentTag", parentTag)
                .With("tag", tag))
            {
                var viewToUpdate = ResolveView(tag);
                // TODO: call viewToUpdate.Measure()

            }
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

        private IViewManager ResolveViewManager(int tag)
        {
            var viewManager = default(IViewManager);
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

        internal void RemoveRootView(int rootViewTag)
        {
            throw new NotImplementedException();
        }

        internal void CreateView(ThemedReactContext themedContext, int tag, string className, CatalystStylesDiffMap initialProps)
        {
            throw new NotImplementedException();
        }

        internal void ManageChildren(int tag, int[] indicesToRemove, ViewAtIndex[] viewsToAdd, int[] tagsToDelete)
        {
            throw new NotImplementedException();
        }

        internal void AddRootView(int tag, SizeMonitoringFrameLayout rootView, ThemedReactContext themedRootContext)
        {
            throw new NotImplementedException();
        }

        internal void SetJavaScriptResponder(int tag, int initialTag, bool blockNativeResponder)
        {
            throw new NotImplementedException();
        }

        internal void Measure(int reactTag, int[] _measureBuffer)
        {
            throw new NotImplementedException();
        }

        internal void ClearJavaScriptResponder()
        {
            throw new NotImplementedException();
        }

        internal void DispatchCommand(int reactTag, int commandId, JArray commandArgs)
        {
            throw new NotImplementedException();
        }

        internal void ShowPopupMenu(object tag, JArray items, ICallback success)
        {
            throw new NotImplementedException();
        }
    }
}
