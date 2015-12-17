using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Bridge
{
    public interface LifecycleEventListener
    {
        /// <summary>
        /// Called when host (activity/service) receives resume event (e.g. {@link Activity#onResume}
        /// </summary>
        void onHostResume();

        /// <summary>
        /// Called when host (activity/service) receives destroy event (e.g. {@link Activity#onDestroy}
        /// </summary>
        void onHostDestroy();

        /// <summary>
        /// 
        /// </summary>
        void onHostPause();
    }
}
