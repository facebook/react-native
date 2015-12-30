using Newtonsoft.Json.Linq;
using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Threading;

namespace ReactNative.UIManager
{
    /// <summary>
    /// This class acts as a buffer for command executed on
    /// <see cref="NativeViewHierarchyManager"/>. It exposes similar methods as
    /// mentioned classes but instead of executing commands immediately, it 
    /// enqueues those operations in a queue that is then flushed from 
    /// <see cref="UIManagerModule"/> once a JavaScript batch of UI operations
    /// is finished.
    /// </summary>
    public class UIViewOperationQueue
    {
        private readonly int[] _measureBuffer = new int[4];

        private readonly IList<Action> _operations = new List<Action>();

        private readonly NativeViewHierarchyManager _nativeViewHierarchyManager;
        private readonly ReactApplicationContext _reactContext;

        public UIViewOperationQueue(ReactApplicationContext reactContext, NativeViewHierarchyManager nativeViewHierarchyManager)
        {
            _nativeViewHierarchyManager = nativeViewHierarchyManager;
            _reactContext = reactContext;
        }

        /// <summary>
        /// Checks if the operation queue is empty.
        /// </summary>
        /// <returns>
        /// <b>true</b> if the queue is empty, <b>false</b> otherwise.
        /// </returns>
        public bool IsEmpty()
        {
            lock (_operations)
            {
                return _operations.Count == 0;
            }
        }

        public void AddRootView(
            int tag, 
            SizeMonitoringFrameLayout rootView, 
            ThemedReactContext themedRootContext)
        {
            if (DispatcherHelpers.IsOnDispatcher())
            {
                _nativeViewHierarchyManager.AddRootView(tag, rootView, themedRootContext);
            }
            else
            {
                var eventHandler = new AutoResetEvent(false);
                _reactContext.RunOnDispatcherQueueThread(() =>
                {
                    _nativeViewHierarchyManager.AddRootView(tag, rootView, themedRootContext);
                    eventHandler.Set();
                });

                // TODO: make asynchronous?
                if (!eventHandler.WaitOne(5000))
                {
                    // TODO: soft assertion?
                    throw new InvalidOperationException("Timed out adding root view.");
                }
            }
        }

        public void EnqueueRemoveRootView(int rootViewTag)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.RemoveRootView(rootViewTag));
        }

        public void EnqueueSetJavaScriptResponder(
            int tag,
            int initialTag,
            bool blockNativeResponder)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.SetJavaScriptResponder(
                tag,
                initialTag,
                blockNativeResponder));
        }

        public void EnqueueClearJavaScriptResponder()
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.ClearJavaScriptResponder());
        }

        public void EnqueueDispatchCommand(int tag, int command, JArray args)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.DispatchCommand(tag, command, args));
        }

        public void EnqueueShowPopupMenu(int tag, string[] items, ICallback error, ICallback success)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.ShowPopupMenu(tag, items, success));
        }

        public void EnqueueUpdateLayout(
            int parentTag,
            int tag,
            int x,
            int y,
            int width,
            int height)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.UpdateLayout(
                parentTag,
                tag,
                x,
                y,
                width,
                height));
        }

        public void EnqueueCreateView(
            ThemedReactContext themedContext,
            int tag,
            string className,
            CatalystStylesDiffMap initialProperties)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.CreateView(
                themedContext,
                tag,
                className,
                initialProperties));
        }

        public void EnqueueUpdateProperties(int tag, string className, CatalystStylesDiffMap properties)
        {
            EnqueueOperation(() =>
                _nativeViewHierarchyManager.UpdateProperties(tag, properties));
        }

        internal void EnqueueManageChildren(
            int tag,
            int[] indicesToRemove,
            ViewAtIndex[] viewsToAdd,
            int[] tagsToDelete)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.ManageChildren(
                tag,
                indicesToRemove,
                viewsToAdd,
                tagsToDelete));
        }

        public void EnqueueUpdateViewExtraData(int tag, object data)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.UpdateViewExtraData(tag, data));
        }

        private void EnqueueOperation(Action action)
        {
            lock (_operations)
            {
                _operations.Add(action);
            }
        }

        public void DispatchViewUpdates(int batchId)
        {
            throw new NotImplementedException();
        }

        internal void EnqueueMeasure(int reactTag, ICallback callback)
        {
            //TODO
            throw new NotImplementedException();
        }

        internal void SuspendFrameCallback()
        {
            throw new NotImplementedException();
        }

        internal void ResumeFrameCallback()
        {
            throw new NotImplementedException();
        }
    }
}
