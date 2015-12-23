
using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Simple container class to keep track of <see cref="ReactShadowNode" />s associated with a particular
    /// <see cref="UIManagerModule" /> instance.
    /// </summary>
    class ShadowNodeRegistry
    {
        private readonly Dictionary<int, ReactShadowNode> _TagsToCSSNodes;
        private readonly Dictionary<int, bool> _RootTags;

        public ShadowNodeRegistry()
        {
            _TagsToCSSNodes = new Dictionary<int, ReactShadowNode>();
            _RootTags = new Dictionary<int, bool>();
        }

        public void addRootNode(ReactShadowNode node)
        {
            int tag = node.getReactTag();
            _TagsToCSSNodes.Add(tag, node);
            _RootTags.Add(tag, true);
        }

        public void removeRootNode(int tag)
        {
            if (!_RootTags.ContainsKey(tag))
            {
                throw new InvalidOperationException(
                    "View with tag " + tag + " is not registered as a root view");
            }

            _TagsToCSSNodes.Remove(tag);
            _RootTags.Remove(tag);
        }

        public void addNode(ReactShadowNode node)
        {
            _TagsToCSSNodes.Add(node.getReactTag(), node);
        }

        public void removeNode(int tag)
        {
            if (_RootTags[tag])
            {
                throw new InvalidOperationException(
                    "Trying to remove root node " + tag + " without using removeRootNode!");
            }
            _TagsToCSSNodes.Remove(tag);
        }

        public ReactShadowNode getNode(int tag)
        {
            return _TagsToCSSNodes[tag];
        }

        public bool isRootNode(int tag)
        {
            return _RootTags.ContainsKey(tag);
        }

        public int getRootNodeCount()
        {
            return _RootTags.Count;
        }

    }
}
