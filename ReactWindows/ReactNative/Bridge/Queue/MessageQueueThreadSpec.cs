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

        public static MessageQueueThreadSpec MainUiThreadSpec { get; } = new MessageQueueThreadSpec(MessageQueueThreadKind.MainUi, "main_ui");

        public static MessageQueueThreadSpec Create(string name, MessageQueueThreadKind kind)
        {
            if (kind == MessageQueueThreadKind.MainUi)
            {
                throw new NotSupportedException("Use the singleton MainUiThreadSpec instance.");
            }

            return new MessageQueueThreadSpec(kind, name);
        }
    }
}
