using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using Newtonsoft.Json.Linq;

namespace ReactNative.UIManager
{
    /// <summary>
    /// This class acts as a buffer for command executed on <see cref="NativeViewHierarchyManager"/>. It expose similar 
    /// methods as mentioned classes but instead of executing commands immediately it enqueues those operations 
    /// in a queue that is then flushed from <see cref="UIManagerModule"/> once JS batch of ui operations is finished.
    /// </summary>
    public class UIViewOperationQueue
    {
        private readonly int[] _MeasureBuffer = new int[4];
        private readonly NativeViewHierarchyManager _NativeViewHierarchyManager;
        private readonly ReactApplicationContext _ReactApplicationContext;

        /// <summary>
        /// A spec for an operation on the native View hierarchy.
        /// </summary>
        protected interface UIOperation
        {
            void execute();
        }

        /// <summary>
        /// A spec for an operation on the native View hierarchy.
        /// </summary>
        private abstract class ViewOperation : UIOperation
        {

            public int mTag;

            public ViewOperation(int tag)
            {
                mTag = tag;
            }

            public abstract void execute();
        }

        public UIViewOperationQueue(ReactApplicationContext reactContext, NativeViewHierarchyManager nativeViewHierarchyManager)
        {
            _NativeViewHierarchyManager = nativeViewHierarchyManager;
            _ReactApplicationContext = reactContext;
        }

        internal void DispatchViewUpdates(int batchId)
        {
            throw new NotImplementedException();
        }

        internal void AddRootView(int tag, SizeMonitoringFrameLayout rootView, ThemedReactContext context)
        {
            throw new NotImplementedException();
        }

        internal void EnqueueRemoveRootView(int rootViewTag)
        {
            throw new NotImplementedException();
        }

        internal bool IsEmpty()
        {
            throw new NotImplementedException();
        }

        internal void EnqueueMeasure(int reactTag, ICallback callback)
        {
            throw new NotImplementedException();
        }

        internal void EnqueueSetJavaScriptResponder(int reactTag1, int reactTag2, bool blockNativeResponder)
        {
            throw new NotImplementedException();
        }

        internal void EnqueueClearJavaScriptResponder()
        {
            throw new NotImplementedException();
        }

        internal void EnqueueDispatchViewManagerCommand(int reactTag, int commandId, JArray commandArgs)
        {
            throw new NotImplementedException();
        }

        internal void EnqueueShowPopupMenu(int reactTag, JArray items, ICallback error, ICallback success)
        {
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
