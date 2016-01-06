using System;
using System.Collections.Generic;
using Windows.UI.Xaml.Documents;

namespace ReactNative.Views.Text
{
    abstract class InlineManager
    {
        private List<Action<Inline>> _actions = new List<Action<Inline>>();

        public void Do(Action<Inline> action)
        {
            _actions.Add(action);
        }

        protected abstract Inline Create();

        public Inline Evaluate()
        {
            var inline = Create();

            foreach (var action in _actions)
            {
                action(inline);
            }

            foreach (var action in _actions)
            {
                action(inline);
            }

            return inline;
        }
    }
}
