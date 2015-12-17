using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ReactNative.Bridge.Queue
{
    class CatalystQueueConfiguration : ICatalystQueueConfiguration, IDisposable
    {
        private readonly MessageQueueThread _dispatcherQueueThread;
        private readonly MessageQueueThread _nativeModulesQueueThread;
        private readonly MessageQueueThread _jsQueueThread;

        private CatalystQueueConfiguration(
            MessageQueueThread dispatcherQueueThread,
            MessageQueueThread nativeModulesQueueThread,
            MessageQueueThread jsQueueThread)
        {
            _dispatcherQueueThread = dispatcherQueueThread;
            _nativeModulesQueueThread = nativeModulesQueueThread;
            _jsQueueThread = jsQueueThread;
        }

        public IMessageQueueThread DispatcherQueueThread
        {
            get
            {
                return _dispatcherQueueThread;
            }
        }

        public IMessageQueueThread NativeModulesQueueThread
        {
            get
            {
                return _nativeModulesQueueThread;
            }
        }

        public IMessageQueueThread JSQueueThread
        {
            get
            {
                return _jsQueueThread;
            }
        }

        public void Dispose()
        {
            _dispatcherQueueThread.Dispose();
            _nativeModulesQueueThread.Dispose();
            _jsQueueThread.Dispose();
        }

        public static CatalystQueueConfiguration Create(
            CatalystQueueConfigurationSpec spec,
            Action<Exception> exceptionHandler)
        {
            var dispatcherThreadSpec = MessageQueueThreadSpec.DispatcherThreadSpec;
            var dispatcherThread = MessageQueueThread.Create(dispatcherThreadSpec, exceptionHandler);

            var jsThread = spec.JSQueueThreadSpec != dispatcherThreadSpec
                ? MessageQueueThread.Create(spec.JSQueueThreadSpec, exceptionHandler)
                : dispatcherThread;

            var nativeModulesThread = spec.NativeModulesQueueThreadSpec != dispatcherThreadSpec
                ? MessageQueueThread.Create(spec.NativeModulesQueueThreadSpec, exceptionHandler)
                : dispatcherThread;

            return new CatalystQueueConfiguration(dispatcherThread, nativeModulesThread, jsThread);
        }

        public sealed class Builder
        {

        }
    }
}
