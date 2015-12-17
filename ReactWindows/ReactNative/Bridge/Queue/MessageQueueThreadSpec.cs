using System;

namespace ReactNative.Bridge.Queue
{
    public class MessageQueueThreadSpec
    {
        private MessageQueueThreadSpec(MessageQueueThreadKind kind, string name)
        {
            Name = name;
            Kind = kind;
        }

        public string Name { get; }

        internal MessageQueueThreadKind Kind { get; }

        public static MessageQueueThreadSpec DispatcherThreadSpec { get; } = new MessageQueueThreadSpec(MessageQueueThreadKind.DispatcherThread, "main_ui");

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
