using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

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

        public static MessageQueueThreadSpec MainUiThreadSpec { get; } = new MessageQueueThreadSpec(MessageQueueThreadKind.MainUi, "main_ui")

        public static MessageQueueThreadSpec Create(string name)
        {
            return new MessageQueueThreadSpec(MessageQueueThreadKind.NewBackground, name);
        }

        enum MessageQueueThreadKind
        {
            MainUi,
            NewBackground,
        }
    }
}
