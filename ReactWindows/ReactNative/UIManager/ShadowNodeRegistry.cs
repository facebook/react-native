using System;
using System.Collections.Generic;
using System.Globalization;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Simple container class to keep track of <see cref="ReactShadowNode"/>s
    /// associated with a particular <see cref="UIManagerModule"/> instance.
    /// </summary>
    class ShadowNodeRegistry
    {
        private readonly IDictionary<int, ReactShadowNode> _tagsToCssNodes =
            new Dictionary<int, ReactShadowNode>();

        private readonly IDictionary<int, bool> _rootTags =
            new Dictionary<int, bool>();

        public ICollection<int> RootNodeTags
        {
            get
            {
                return _rootTags.Keys;
            }
        }  

        public void AddRootNode(ReactShadowNode node)
        {
            if (node == null)
                throw new ArgumentNullException(nameof(node));

            var tag = node.ReactTag;
            _tagsToCssNodes[tag] = node;
            _rootTags[tag] = true;
        }

        public void RemoveRootNode(int tag)
        {
            if (!_rootTags.ContainsKey(tag))
            {
                throw new KeyNotFoundException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "View with tag {0} is not registered as a root view.",
                        tag));
            }

            _tagsToCssNodes.Remove(tag);
            _rootTags.Remove(tag);
        }

        public void AddNode(ReactShadowNode node)
        {
            if (node == null)
                throw new ArgumentNullException(nameof(node));

            _tagsToCssNodes[node.ReactTag] = node;
        }

        public void RemoveNode(int tag)
        {
            var isRoot = default(bool);
            if (_rootTags.TryGetValue(tag, out isRoot) && isRoot)
            {
                throw new KeyNotFoundException(
                    string.Format(
                        CultureInfo.InvariantCulture,
                        "Trying to remove root node {0} without using RemoveRootNode.",
                        tag));
            }

            _tagsToCssNodes.Remove(tag);
        }

        public ReactShadowNode GetNode(int tag)
        {
            var result = default(ReactShadowNode);
            if (_tagsToCssNodes.TryGetValue(tag, out result))
            {
                return result;
            }

            throw new KeyNotFoundException(
                string.Format(
                    CultureInfo.InvariantCulture,
                    "Shadow node for tag '{0}' does not exist.",
                    tag));
        }

        public bool IsRootNode(int tag)
        {
            return _rootTags.ContainsKey(tag);
        }
    }
}
