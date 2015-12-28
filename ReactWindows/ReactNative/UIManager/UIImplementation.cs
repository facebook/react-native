using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using ReactNative.UIManager.Events;
using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// An class that is used to receive React commands from JS and translate them into a
    /// shadow node hierarchy that is then mapped to a native view hierarchy.
    /// 
    /// TODOS
    /// 1. CSSLayoutContext
    /// 2. Implement _ViewManagers registry
    /// 3. Create ShadowNodeRegistry
    /// 4. View reigstration for root and children
    /// 5. Shadow dom item updates
    /// </summary>
    public class UIImplementation
    {
        private readonly ViewManagerRegistry _viewManagers;
        private readonly UIViewOperationQueue _operationsQueue;
        private readonly ShadowNodeRegistry _shadowNodeRegistry = new ShadowNodeRegistry();

        public UIImplementation(
            ReactApplicationContext reactContext, 
            IReadOnlyList<IViewManager> viewManagers)
        {
            _viewManagers = new ViewManagerRegistry(viewManagers);
            _operationsQueue = new UIViewOperationQueue(reactContext, new NativeViewHierarchyManager(_viewManagers));
        }

        /// <summary>
        /// Called when the host receives the suspend event.
        /// </summary>
        public void OnSuspend()
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Called when the host receives the resume event.
        /// </summary>
        public void OnResume()
        {
            throw new NotImplementedException();
        }

        /// <summary>
        /// Called when the host is shutting down.
        /// </summary>
        public void OnShutdown()
        {
            throw new NotImplementedException();
        }

        internal void DispatchViewUpdates(EventDispatcher _eventDispatcher, int batchId)
        {
            throw new NotImplementedException();
        }

        internal void ConfigureNextLayoutAnimation(Dictionary<string, object> config, ICallback success, ICallback error)
        {
            throw new NotImplementedException();
        }

        internal void SetLayoutAnimationEnabledExperimental(bool enabled)
        {
            throw new NotImplementedException();
        }

        internal void ShowPopupMenu(int reactTag, JArray items, ICallback error, ICallback success)
        {
            throw new NotImplementedException();
        }

        internal void DispatchViewManagerCommand(int reactTag, int commandId, JArray commandArgs)
        {
            throw new NotImplementedException();
        }

        internal void RemoveRootView(int rootViewTag)
        {
            throw new NotImplementedException();
        }

        internal void ClearJavaScriptResponder()
        {
            throw new NotImplementedException();
        }

        internal void SetJavaScriptResponder(int reactTag, bool blockNativeResponder)
        {
            throw new NotImplementedException();
        }

        internal void CreateView(int tag, string className, int rootViewTag, JObject props)
        {
            throw new NotImplementedException();
        }

        internal void UpdateView(int tag, string className, JObject props)
        {
            throw new NotImplementedException();
        }

        internal void ManageChildren(int viewTag, JArray moveFrom, JArray moveTo, JArray addChildTags, JArray addAtIndices, JArray removeFrom)
        {
            throw new NotImplementedException();
        }

        internal void ReplaceExistingNonRootView(int oldTag, int newTag)
        {
            throw new NotImplementedException();
        }

        internal void RemoveSubviewsFromContainerWithID(int containerTag)
        {
            throw new NotImplementedException();
        }

        internal void Measure(int reactTag, ICallback callback)
        {
            throw new NotImplementedException();
        }

        internal void MeasureLayout(int tag, int ancestorTag, ICallback errorCallback, ICallback successCallback)
        {
            throw new NotImplementedException();
        }

        internal void MeasureLayoutRelativeToParent(int tag, ICallback errorCallback, ICallback successCallback)
        {
            throw new NotImplementedException();
        }
    }
}
