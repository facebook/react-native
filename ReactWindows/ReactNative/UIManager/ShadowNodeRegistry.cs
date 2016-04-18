using System;
using System.Collections.Generic;

namespace ReactNative.UIManager
{
    /// <summary>
    /// Simple container class to keep track of <see cref="ReactShadowNode"/>s
    /// associated with a particular <see cref="UIManagerModule"/> instance.
    /// </summary>
    public class ShadowNodeRegistry
    {
        private readonly IDictionary<int, ReactShadowNode> _tagsToCssNodes =
            new Dictionary<int, ReactShadowNode>();

        private readonly IDictionary<int, bool> _rootTags =
            new Dictionary<int, bool>();

        /// <summary>
        /// The collection of root node tags.
        /// </summary>
        public ICollection<int> RootNodeTags
        {
            get
            {
                return _rootTags.Keys;
            }
        }  

        /// <summary>
        /// Add a root shadow node.
        /// </summary>
        /// <param name="node">The node.</param>
        public void AddRootNode(ReactShadowNode node)
        {
           if (node == null)
                throw new ArgumentNullException(nameof(node));

            var tag = node.ReactTag;
            _tagsToCssNodes[tag] = node;
            _rootTags[tag] = true;
        }

        /// <summary>
        /// Remove a root shadow node.
        /// </summary>
        /// <param name="tag">The tag of the node to remove.</param>
        public void RemoveRootNode(int tag)
        {
            if (!_rootTags.ContainsKey(tag))
            {
                throw new KeyNotFoundException(
                    $"View with tag '{tag}' is not registered as a root view.");
            }

            _tagsToCssNodes.Remove(tag);
            _rootTags.Remove(tag);
        }

        /// <summary>
        /// Add a react shadow node.
        /// </summary>
        /// <param name="node">The node to add.</param>
        public void AddNode(ReactShadowNode node)
        {
            if (node == null)
                throw new ArgumentNullException(nameof(node));

            _tagsToCssNodes[node.ReactTag] = node;
        }

        /// <summary>
        /// Remove a react shadow node.
        /// </summary>
        /// <param name="tag">The tag of the node to remove.</param>
        public void RemoveNode(int tag)
        {
            var isRoot = default(bool);
            if (_rootTags.TryGetValue(tag, out isRoot) && isRoot)
            {
                throw new KeyNotFoundException(
                    $"Trying to remove root node '{tag}' without using RemoveRootNode.");
            }

            _tagsToCssNodes.Remove(tag);
        }

        /// <summary>
        /// Retrieve a react shadow node.
        /// </summary>
        /// <param name="tag">The tag of the node to retrieve.</param>
        /// <returns>The react shadow node.</returns>
        public ReactShadowNode GetNode(int tag)
        {
            var result = default(ReactShadowNode);
            if (_tagsToCssNodes.TryGetValue(tag, out result))
            {
                return result;
            }

            throw new KeyNotFoundException(
                $"Shadow node for tag '{tag}' does not exist.");
        }

        /// <summary>
        /// Checks if a node with the given tag is a root node.
        /// </summary>
        /// <param name="tag">The tag.</param>
        /// <returns>
        /// <b>true</b> if the node with the given tag is a root node,
        /// <b>false</b> otherwise.
        /// </returns>
        public bool IsRootNode(int tag)
        {
            return _rootTags.ContainsKey(tag);
        }
    }
}
