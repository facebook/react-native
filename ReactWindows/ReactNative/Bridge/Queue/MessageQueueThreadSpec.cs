using System;

namespace ReactNative.Bridge.Queue
{
    /// <summary>
    /// Specification for creating a <see cref="IMessageQueueThread"/>.
    /// </summary>
    public class MessageQueueThreadSpec
    {
        private MessageQueueThreadSpec(MessageQueueThreadKind kind, string name)
        {
            Name = name;
            Kind = kind;
        }

        /// <summary>
        /// The name of the <see cref="IMessageQueueThread"/>.
        /// </summary>
        public string Name { get; }

        /// <summary>
        /// The type of the <see cref="IMessageQueueThread"/>.
        /// </summary>
        internal MessageQueueThreadKind Kind { get; }

        /// <summary>
        /// Singleton dispatcher <see cref="IMessageQueueThread"/> specification.
        /// </summary>
        public static MessageQueueThreadSpec DispatcherThreadSpec { get; } = new MessageQueueThreadSpec(MessageQueueThreadKind.DispatcherThread, "main_ui");

        /// <summary>
        /// Factory for creating <see cref="MessageQueueThreadSpec"/>s.
        /// </summary>
        /// <param name="name">The name.</param>
        /// <param name="kind">The kind.</param>
        /// <returns>The instance.</returns>
        public static MessageQueueThreadSpec Create(string name, MessageQueueThreadKind kind)
        {
            if (kind == MessageQueueThreadKind.DispatcherThread)
            {
                throw new NotSupportedException("Use the singleton MainUiThreadSpec instance.");
            }

            return new MessageQueueThreadSpec(kind, name);
        }
    }
}
