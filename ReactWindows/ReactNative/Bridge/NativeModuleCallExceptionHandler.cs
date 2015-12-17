using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Bridge
{
    public interface NativeModuleCallExceptionHandler
    {
        void handleException(Exception e);
    }
}
