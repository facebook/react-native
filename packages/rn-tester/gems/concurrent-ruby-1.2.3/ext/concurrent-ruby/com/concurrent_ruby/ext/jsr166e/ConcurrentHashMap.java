package com.concurrent_ruby.ext.jsr166e;

import java.util.Map;
import java.util.Set;

public interface ConcurrentHashMap<K, V> {
    /** Interface describing a function of one argument */
    public interface Fun<A,T> { T apply(A a); }
    /** Interface describing a function of two arguments */
    public interface BiFun<A,B,T> { T apply(A a, B b); }

    public V get(K key);
    public V put(K key, V value);
    public V putIfAbsent(K key, V value);
    public V computeIfAbsent(K key, Fun<? super K, ? extends V> mf);
    public V computeIfPresent(K key, BiFun<? super K, ? super V, ? extends V> mf);
    public V compute(K key, BiFun<? super K, ? super V, ? extends V> mf);
    public V merge(K key, V value, BiFun<? super V, ? super V, ? extends V> mf);
    public boolean replace(K key, V oldVal, V newVal);
    public V replace(K key, V value);
    public boolean containsKey(K key);
    public boolean remove(Object key, Object value);
    public V remove(K key);
    public void clear();
    public Set<Map.Entry<K,V>> entrySet();
    public int size();
    public V getValueOrDefault(Object key, V defaultValue);

    public boolean containsValue(V value);
    public K findKey(V value);
}
