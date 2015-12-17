using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Bridge.Queue
{
    public interface ICatalystQueueConfiguration
    {
        IMessageQueueThread DispatcherQueueThread { get; }
        IMessageQueueThread NativeModulesQueueThread { get; }
        IMessageQueueThread JSQueueThread { get; }
    }
}
