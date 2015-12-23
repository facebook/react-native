using ReactNative.Bridge;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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

    }
}
