using System;

namespace ReactNative.Bridge.Queue
{
    /// <summary>
    /// Specification for creating a <see cref="ICatalystQueueConfiguration"/>.
    /// This exists so the <see cref="ICatalystInstance"/> is able to set
    /// exception handlers on the <see cref="IMessageQueueThread"/>s it uses.
    /// </summary>
    public sealed class CatalystQueueConfigurationSpec
    {
        private CatalystQueueConfigurationSpec(
            MessageQueueThreadSpec nativeModulesQueueThreadSpec,
            MessageQueueThreadSpec jsQueueThreadSpec)
        {
            NativeModulesQueueThreadSpec = nativeModulesQueueThreadSpec;
            JSQueueThreadSpec = jsQueueThreadSpec;
        }

        /// <summary>
        /// The native modules <see cref="IMessageQueueThread"/> specification.
        /// </summary>
        public MessageQueueThreadSpec NativeModulesQueueThreadSpec
        {
            get;
        }

        /// <summary>
        /// The JavaScript <see cref="IMessageQueueThread"/> specification.
        /// </summary>
        public MessageQueueThreadSpec JSQueueThreadSpec
        {
            get;
        }
        
        /// <summary>
        /// The default <see cref="CatalystQueueConfigurationSpec"/> instance.
        /// </summary>
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

        /// <summary>
        /// Builder for <see cref="CatalystQueueConfigurationSpec"/>.
        /// </summary>
        public sealed class Builder
        {
            private MessageQueueThreadSpec _nativeModulesQueueThreadSpec;
            private MessageQueueThreadSpec _jsQueueThreadSpec;

            /// <summary>
            /// Set the native modules <see cref="MessageQueueThreadSpec"/>.
            /// </summary>
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

            /// <summary>
            /// Set the JavaScript <see cref="MessageQueueThreadSpec"/>.
            /// </summary>
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

            /// <summary>
            /// Build the <see cref="CatalystQueueConfigurationSpec"/>.
            /// </summary>
            /// <returns>The instance.</returns>
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
