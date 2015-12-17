using System;

namespace ReactNative.Bridge.Queue
{
    public sealed class CatalystQueueConfigurationSpec
    {
        private CatalystQueueConfigurationSpec(
            MessageQueueThreadSpec nativeModulesQueueThreadSpec,
            MessageQueueThreadSpec jsQueueThreadSpec)
        {
            NativeModulesQueueThreadSpec = nativeModulesQueueThreadSpec;
            JSQueueThreadSpec = jsQueueThreadSpec;
        }

        public MessageQueueThreadSpec NativeModulesQueueThreadSpec
        {
            get;
        }

        public MessageQueueThreadSpec JSQueueThreadSpec
        {
            get;
        }

        public static CatalystQueueConfigurationSpec Default { get; } = CreateDefault();

        private static CatalystQueueConfigurationSpec CreateDefault()
        {
            return new Builder()
            {
                JSQueueThreadSpec = MessageQueueThreadSpec.Create("js", MessageQueueThreadKind.BackgroundSingleThread),
                NativeModulesQueueThreadSpec = MessageQueueThreadSpec.Create("native_modules", MessageQueueThreadKind.BackgroundAnyThread),
            }
            .Build();
        }

        public sealed class Builder
        {
            private MessageQueueThreadSpec _nativeModulesQueueThreadSpec;
            private MessageQueueThreadSpec _jsQueueThreadSpec;

            public MessageQueueThreadSpec NativeModulesQueueThreadSpec
            {
                set
                {
                    if (_nativeModulesQueueThreadSpec != null)
                    {
                        throw new InvalidOperationException("Setting native modules queue thread spec multiple times!");
                    }

                    _nativeModulesQueueThreadSpec = value;
                }
            }

            public MessageQueueThreadSpec JSQueueThreadSpec
            {
                set
                {
                    if (_jsQueueThreadSpec != null)
                    {
                        throw new InvalidOperationException("Setting native modules queue thread spec multiple times!");
                    }

                    _jsQueueThreadSpec = value;
                }
            }

            public CatalystQueueConfigurationSpec Build()
            {
                if (_nativeModulesQueueThreadSpec == null)
                {
                    throw new InvalidOperationException("Native modules queue thread spec has not been set.");
                }

                if (_jsQueueThreadSpec == null)
                {
                    throw new InvalidOperationException("JS queue thread spec has not been set.");
                }

                return new CatalystQueueConfigurationSpec(_nativeModulesQueueThreadSpec, _jsQueueThreadSpec);
            }
        }
    }
}
