using Newtonsoft.Json.Linq;
using ReactNative.Animation;
using ReactNative.Bridge;
using ReactNative.Tracing;
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

        private readonly object _operationsLock = new object();
        private IList<Action> _operations = new List<Action>();
        private readonly NativeViewHierarchyManager _nativeViewHierarchyManager;
        private readonly ReactContext _reactContext;

        /// <summary>
        /// Instantiates the <see cref="UIViewOperationQueue"/>.
        /// </summary>
        /// <param name="reactContext">The react context.</param>
        /// <param name="nativeViewHierarchyManager">
        /// The native view hierarchy manager.
        /// </param>
        public UIViewOperationQueue(ReactContext reactContext, NativeViewHierarchyManager nativeViewHierarchyManager)
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

        /// <summary>
        /// Adds a root view to the hierarchy.
        /// </summary>
        /// <param name="tag">The root view tag.</param>
        /// <param name="rootView">The root view.</param>
        /// <param name="themedRootContext">The react context.</param>
        public void AddRootView(
            int tag, 
            SizeMonitoringCanvas rootView, 
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

        /// <summary>
        /// Enqueues an operation to remove the root view.
        /// </summary>
        /// <param name="rootViewTag">The root view tag.</param>
        public void EnqueueRemoveRootView(int rootViewTag)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.RemoveRootView(rootViewTag));
        }

        /// <summary>
        /// Enqueues an operation to set the JavaScript responder.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="initialTag">The initial tag.</param>
        /// <param name="blockNativeResponder">
        /// Signal to block the native responder.
        /// </param>
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

        /// <summary>
        /// Enqueues an operation to clear the JavaScript responder.
        /// </summary>
        public void EnqueueClearJavaScriptResponder()
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.ClearJavaScriptResponder());
        }

        /// <summary>
        /// Enqueues an operation to dispatch a command.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="commandId">The command identifier.</param>
        /// <param name="commandArgs">The command arguments.</param>
        public void EnqueueDispatchCommand(int tag, int commandId, JArray commandArgs)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.DispatchCommand(tag, commandId, commandArgs));
        }

        /// <summary>
        /// Enqueues an operation to update the extra data for a view.
        /// </summary>
        /// <param name="reactTag">The view tag.</param>
        /// <param name="extraData">The extra data.</param>
        public void EnqueueUpdateExtraData(int reactTag, object extraData)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.UpdateViewExtraData(reactTag, extraData));
        }

        /// <summary>
        /// Enqueues an operation to show a popup menu.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="items">The menu items.</param>
        /// <param name="error">Called on error.</param>
        /// <param name="success">Called on success.</param>
        public void EnqueueShowPopupMenu(int tag, string[] items, ICallback error, ICallback success)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.ShowPopupMenu(tag, items, success));
        }

        /// <summary>
        /// Enqueues an operation to create a view.
        /// </summary>
        /// <param name="themedContext">The react context.</param>
        /// <param name="viewReactTag">The view react tag.</param>
        /// <param name="viewClassName">The view class name.</param>
        /// <param name="initialProperties">The initial properties.</param>
        public void EnqueueCreateView(
            ThemedReactContext themedContext,
            int viewReactTag,
            string viewClassName,
            CatalystStylesDiffMap initialProperties)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.CreateView(
                themedContext,
                viewReactTag,
                viewClassName,
                initialProperties));
        }

        /// <summary>
        /// Clears the animation layout updates.
        /// </summary>
        public void ClearAnimationLayout()
        {
            _nativeViewHierarchyManager.ClearLayoutAnimation();
        }

        /// <summary>
        /// Enqueue a configure layout animation operation.
        /// </summary>
        /// <param name="config">The configuration.</param>
        /// <param name="success">The success callback.</param>
        /// <param name="error">The error callback.</param>
        public void EnqueueConfigureLayoutAnimation(JObject config, ICallback success, ICallback error)
        {
            EnqueueOperation(() => _nativeViewHierarchyManager.ConfigureLayoutAnimation(config, success, error));
        }
        
        /// <summary>
        /// Enqueues an operation to update the properties of a view.
        /// </summary>
        /// <param name="tag">The view tag.</param>
        /// <param name="className">The class name.</param>
        /// <param name="properties">The properties.</param>
        public void EnqueueUpdateProperties(int tag, string className, CatalystStylesDiffMap properties)
        {
            EnqueueOperation(() =>
                _nativeViewHierarchyManager.UpdateProperties(tag, properties));
        }

        /// <summary>
        /// Enqueues an operation to update the layout of a view.
        /// </summary>
        /// <param name="parentTag">The parent tag.</param>
        /// <param name="tag">The view tag.</param>
        /// <param name="x">The x-coordinate of the view.</param>
        /// <param name="y">The y-coordinate of the view.</param>
        /// <param name="width">The width of the view.</param>
        /// <param name="height">The height of the view.</param>
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

        /// <summary>
        /// Enqueues an operation to manage the children of a view.
        /// </summary>
        /// <param name="tag">The view to manage.</param>
        /// <param name="indicesToRemove">The indices to remove.</param>
        /// <param name="viewsToAdd">The views to add.</param>
        /// <param name="tagsToDelete">The tags to delete.</param>
        public void EnqueueManageChildren(
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

        /// <summary>
        /// Enqueues an operation to measure the view.
        /// </summary>
        /// <param name="reactTag">The tag of the view to measure.</param>
        /// <param name="callback">The measurement result callback.</param>
        public void EnqueueMeasure(int reactTag, ICallback callback)
        {
            EnqueueOperation(() =>
            {
                try
                {
                    _nativeViewHierarchyManager.Measure(reactTag, _measureBuffer);
                }
                catch (Exception)
                {
                    callback.Invoke();
                    return;
                }

                var x = _measureBuffer[0]; // TODO: convert pixels to DIP?
                var y = _measureBuffer[1]; // TODO: convert pixels to DIP?
                var width = _measureBuffer[2]; // TODO: convert pixels to DIP?
                var height = _measureBuffer[3]; // TODO: convert pixels to DIP?
                callback.Invoke(0, 0, width, height, x, y);
            });
        }

        /// <summary>
        /// Enqueues an operation to find a touch target.
        /// </summary>
        /// <param name="reactTag">The parent view to search from.</param>
        /// <param name="targetX">The x-coordinate of the touch event.</param>
        /// <param name="targetY">The y-coordinate of the touch event.</param>
        /// <param name="callback">The callback.</param>
        public void EnqueueFindTargetForTouch(
            int reactTag,
            double targetX,
            double targetY,
            ICallback callback)
        {
            EnqueueOperation(() =>
            {
                try
                {
                    _nativeViewHierarchyManager.Measure(reactTag, _measureBuffer);
                }
                catch
                {
                    // TODO: catch specific exception?
                    callback.Invoke();
                    return;
                }

                var containerX = (double)_measureBuffer[0];
                var containerY = (double)_measureBuffer[1];
                var touchTargetReactTag = _nativeViewHierarchyManager.FindTargetForTouch(reactTag, targetX, targetY);

                try
                {
                    _nativeViewHierarchyManager.Measure(touchTargetReactTag, _measureBuffer);
                }
                catch
                {
                    // TODO: catch specific exception?
                    callback.Invoke();
                    return;
                }

                var x = _measureBuffer[0] - containerX; // TODO: convert to DIP from pixel?
                var y = _measureBuffer[1] - containerY; // TODO: convert to DIP from pixel?
                var width = _measureBuffer[2]; // TODO: convert to DIP from pixel?
                var height = _measureBuffer[3]; // TODO: convert to DIP from pixel?
                callback.Invoke(touchTargetReactTag, x, y, width, height);
            });
        }

        /// <summary>
        /// Dispatches the view updates.
        /// </summary>
        /// <param name="batchId">The batch identifier.</param>
        internal void ExecuteOperations(int batchId)
        {
            DispatcherHelpers.AssertOnDispatcher();

            var operations = default(IList<Action>);
            lock (_operationsLock)
            {
                operations = _operations.Count == 0 ? null : _operations;
                if (operations != null)
                {
                    _operations = new List<Action>();
                }
            }

            using (Tracer.Trace(Tracer.TRACE_TAG_REACT_BRIDGE, "DispatchUI")
                .With("BatchId", batchId))
            {
                if (operations != null)
                {
                    foreach (var operation in operations)
                    {
                        operation();
                    }
                }
            }

            _nativeViewHierarchyManager.ClearLayoutAnimation();
        }

        private void EnqueueOperation(Action action)
        {
            lock (_operationsLock)
            {
                _operations.Add(action);
            }
        }
    }
}
