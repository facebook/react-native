using Facebook.CSSLayout;
using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    abstract class CSSNodeVisitor<T>
    {
        public T Visit(CSSNode node)
        {
            if (node == null)
            {
                throw new ArgumentNullException(nameof(node));
            }

            var n = node.ChildCount;
            if (n == 0)
            {
                return Make(node, Array.Empty<T>());
            }
            else
            {
                var children = new List<T>(n);
                foreach (var child in node.Children)
                {
                    children.Add(Visit(child));
                }

                return Make(node, children);
            }
        }

        protected abstract T Make(CSSNode node, IList<T> children);
    }
}
