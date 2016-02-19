using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;

namespace ReactNative.Collections
{
    /// <summary>
    /// Heap based priority queue. For precise algorithm please see wikipedia.
    /// Not thread safe.
    /// </summary>
    /// <typeparam name="T">Element type</typeparam>
    public sealed class HeapBasedPriorityQueue<T>
    {
        /// <summary>
        /// Count for introducing priority of equal elements.
        /// </summary>
        private long _count;

        /// <summary>
        /// Array of indexed items.
        /// </summary>
        private IndexedItem[] _items;

        /// <summary>
        /// The current size of the queue.
        /// </summary>
        private int _size;

        /// <summary>
        /// The comparer.
        /// </summary>
        private readonly IComparer<T> _comparer;

        /// <summary>
        /// Initializes a new instance of the <see cref="HeapBasedPriorityQueue{T}"/> class.
        /// </summary>
        public HeapBasedPriorityQueue(IComparer<T> comparer)
            : this(16, comparer)
        {
        }

        /// <summary>
        /// Initializes a new instance of the <see cref="HeapBasedPriorityQueue{T}"/> class.
        /// </summary>
        /// <param name="capacity">The capacity.</param>
        /// <param name="comparer">Compared used to compare elements in the queue.</param>
        public HeapBasedPriorityQueue(int capacity, IComparer<T> comparer)
        {
            if (comparer == null)
            {
                throw new ArgumentNullException("comparer");
            }

            if (capacity < 0)
            {
                throw new ArgumentOutOfRangeException("capacity");
            }

            _comparer = comparer;
            _items = new IndexedItem[capacity];
            _size = 0;
            _count = 0;

            CheckHeapInvariant();
        }

        /// <summary>
        /// Gets the count of the queue.
        /// </summary>
        public int Count
        {
            get { return _size; }
        }

        /// <summary>
        /// Peeks the element from the queue.
        /// </summary>
        /// <returns>New element.</returns>
        /// <exception cref="System.InvalidOperationException">If the method is called on an empty queue.</exception>
        public T Peek()
        {
            if (_size == 0)
            {
                throw new InvalidOperationException("Peek is not allowed on an empty queue.");
            }

            CheckHeapInvariant();
            return _items[0].Value;
        }

        /// <summary>
        /// De-queues the element with the highest priority.
        /// </summary>
        /// <returns>Highest priority element.</returns>
        public T Dequeue()
        {
            var result = Peek();
            RemoveAt(0);

            CheckHeapInvariant();
            return result;
        }

        /// <summary>
        /// Enqueues the specified item.
        /// </summary>
        /// <param name="item">The item.</param>
        public void Enqueue(T item)
        {
            if (_size >= _items.Length)
            {
                // exponential allocation.
                var temp = _items;
                _items = new IndexedItem[_items.Length * 2];
                Array.Copy(temp, _items, temp.Length);
            }

            var index = _size++;
            _items[index] = new IndexedItem { Value = item, Id = _count++, Comparer = _comparer };
            Percolate(index);

            CheckHeapInvariant();
        }

        /// <summary>
        /// Removes the specified item.
        /// </summary>
        /// <param name="item">The item.</param>
        /// <returns>True if the item has been deleted. False if it does not exists.</returns>
        public bool Remove(T item)
        {
            for (var i = 0; i < _size; ++i)
            {
                if (EqualityComparer<T>.Default.Equals(_items[i].Value, item))
                {
                    RemoveAt(i);
                    CheckHeapInvariant();
                    return true;
                }
            }

            CheckHeapInvariant();
            return false;
        }

        /// <summary>
        /// Determines whether the queue [contains] [the specified item].
        /// </summary>
        /// <param name="item">The item.</param>
        /// <returns>
        ///   <c>true</c> if [contains] [the specified item]; otherwise, <c>false</c>.
        /// </returns>
        public bool Contains(T item)
        {
            for (var i = 0; i < _size; ++i)
            {
                if (EqualityComparer<T>.Default.Equals(_items[i].Value, item))
                {
                    CheckHeapInvariant();
                    return true;
                }
            }

            CheckHeapInvariant();
            return false;
        }

        /// <summary>
        /// Determines whether [is higher priority] [the specified left].
        /// </summary>
        /// <param name="left">The left.</param>
        /// <param name="right">The right.</param>
        /// <returns>
        ///   <c>true</c> if [is higher priority] [the specified left]; otherwise, <c>false</c>.
        /// </returns>
        private bool IsHigherPriority(int left, int right)
        {
            Debug.Assert(left >= 0 & left < _items.Length, "Index should be in range.");
            Debug.Assert(right >= 0 & right < _items.Length, "Index should be in range.");

            return _items[left].CompareTo(_items[right]) < 0;
        }

        /// <summary>
        /// Percolates the specified index.
        /// </summary>
        /// <param name="index">The index.</param>
        /// <returns>The final index of the original element</returns>
        private int Percolate(int index)
        {
            Debug.Assert(index < _size & index >= 0, "Index is out of range: " + index);

            if (index == 0)
            {
                return 0;
            }

            var parent = (index - 1) / 2;

            if (IsHigherPriority(index, parent))
            {
                var temp = _items[index];
                _items[index] = _items[parent];
                _items[parent] = temp;
                return Percolate(parent);
            }

            return index;
        }

        /// <summary>
        /// Heapifies the specified index.
        /// </summary>
        /// <param name="index">The index.</param>
        private void Heapify(int index)
        {
            Debug.Assert(index < _size & index >= 0, "Index is out of range: " + index);

            var left = (2 * index) + 1;
            var right = (2 * index) + 2;
            var first = index;

            if (left < _size && IsHigherPriority(left, first))
            {
                first = left;
            }

            if (right < _size && IsHigherPriority(right, first))
            {
                first = right;
            }

            if (first != index)
            {
                var temp = _items[index];
                _items[index] = _items[first];
                _items[first] = temp;
                Heapify(first);
            }
        }

        /// <summary>
        /// Removes element at the specified index.
        /// </summary>
        /// <param name="index">The index.</param>
        private void RemoveAt(int index)
        {
            Debug.Assert(index >= 0 & index < _items.Length, "Index should be in range.");

            _items[index] = _items[--_size];
            _items[_size] = default(IndexedItem);

            if (index != _size)
            {
                Heapify(Percolate(index));
            }

            if (_size < _items.Length / 4)
            {
                var temp = _items;
                _items = new IndexedItem[_items.Length / 2];
                Array.Copy(temp, 0, _items, 0, _size);
            }

            CheckHeapInvariant();
        }

        [Conditional("HEAP_ASSERT")]
        private void CheckHeapInvariant()
        {
            for (int i = 0; i < _size; i++)
            {
                if (2 * i + 1 < _size && !IsHigherPriority(i, 2 * i + 1)
                    || 2 * i + 2 < _size && !IsHigherPriority(i, 2 * i + 2))
                {
                    throw new Exception("Heap invariant violated");
                }
            }
        }

        /// <summary>
        /// Indexed item.
        /// </summary>
        private struct IndexedItem : IComparable<IndexedItem>
        {
            /// <summary>
            /// Gets or sets the real user value.
            /// </summary>
            public T Value { get; set; }

            /// <summary>
            /// Gets or sets the id.
            /// </summary>
            public long Id { private get; set; }

            /// <summary>
            /// Gets or sets the comparer.
            /// </summary>
            public IComparer<T> Comparer { private get; set; }

            /// <summary>
            /// Compares the current object with another object of the same type.
            /// </summary>
            /// <param name="other">An object to compare with this object.</param>
            /// <returns>
            /// A 32-bit signed integer that indicates the relative order of the objects being compared. The return value has the following meanings: Value Meaning Less than zero This object is less than the <paramref name="other" /> parameter.Zero This object is equal to <paramref name="other" />. Greater than zero This object is greater than <paramref name="other" />.
            /// </returns>
            public int CompareTo(IndexedItem other)
            {
                var c = Comparer.Compare(Value, other.Value);
                if (c != 0)
                {
                    return c;
                }

                return Id.CompareTo(other.Id);
            }
        }
    }
}
