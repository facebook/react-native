/*
 * Copyright (C) 2005, 2006, 2007, 2010 Apple Inc. All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions
 * are met:
 *
 * 1.  Redistributions of source code must retain the above copyright
 *     notice, this list of conditions and the following disclaimer. 
 * 2.  Redistributions in binary form must reproduce the above copyright
 *     notice, this list of conditions and the following disclaimer in the
 *     documentation and/or other materials provided with the distribution. 
 * 3.  Neither the name of Apple Inc. ("Apple") nor the names of
 *     its contributors may be used to endorse or promote products derived
 *     from this software without specific prior written permission. 
 *
 * THIS SOFTWARE IS PROVIDED BY APPLE AND ITS CONTRIBUTORS "AS IS" AND ANY
 * EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL APPLE OR ITS CONTRIBUTORS BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF
 * THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

#ifndef JSRetainPtr_h
#define JSRetainPtr_h

#include <JavaScriptCore/JSContextRef.h>
#include <JavaScriptCore/JSStringRef.h>
#include <algorithm>

inline void JSRetain(JSStringRef string) { JSStringRetain(string); }
inline void JSRelease(JSStringRef string) { JSStringRelease(string); }
inline void JSRetain(JSGlobalContextRef context) { JSGlobalContextRetain(context); }
inline void JSRelease(JSGlobalContextRef context) { JSGlobalContextRelease(context); }

enum AdoptTag { Adopt };

template<typename T> class JSRetainPtr {
public:
    JSRetainPtr() : m_ptr(0) { }
    JSRetainPtr(T ptr) : m_ptr(ptr) { if (ptr) JSRetain(ptr); }
    JSRetainPtr(AdoptTag, T ptr) : m_ptr(ptr) { }
    JSRetainPtr(const JSRetainPtr&);
    template<typename U> JSRetainPtr(const JSRetainPtr<U>&);
    ~JSRetainPtr();
    
    T get() const { return m_ptr; }
    
    void clear();
    T leakRef();

    T operator->() const { return m_ptr; }
    
    bool operator!() const { return !m_ptr; }
    explicit operator bool() const { return m_ptr; }

    JSRetainPtr& operator=(const JSRetainPtr&);
    template<typename U> JSRetainPtr& operator=(const JSRetainPtr<U>&);
    JSRetainPtr& operator=(T);
    template<typename U> JSRetainPtr& operator=(U*);

    void adopt(T);
    
    void swap(JSRetainPtr&);

private:
    T m_ptr;
};

inline JSRetainPtr<JSStringRef> adopt(JSStringRef o)
{
    return JSRetainPtr<JSStringRef>(Adopt, o);
}

inline JSRetainPtr<JSGlobalContextRef> adopt(JSGlobalContextRef o)
{
    return JSRetainPtr<JSGlobalContextRef>(Adopt, o);
}

template<typename T> inline JSRetainPtr<T>::JSRetainPtr(const JSRetainPtr& o)
    : m_ptr(o.m_ptr)
{
    if (m_ptr)
        JSRetain(m_ptr);
}

template<typename T> template<typename U> inline JSRetainPtr<T>::JSRetainPtr(const JSRetainPtr<U>& o)
    : m_ptr(o.get())
{
    if (m_ptr)
        JSRetain(m_ptr);
}

template<typename T> inline JSRetainPtr<T>::~JSRetainPtr()
{
    if (m_ptr)
        JSRelease(m_ptr);
}

template<typename T> inline void JSRetainPtr<T>::clear()
{
    if (T ptr = m_ptr) {
        m_ptr = 0;
        JSRelease(ptr);
    }
}

template<typename T> inline T JSRetainPtr<T>::leakRef()
{
    T ptr = m_ptr;
    m_ptr = 0;
    return ptr;
}

template<typename T> inline JSRetainPtr<T>& JSRetainPtr<T>::operator=(const JSRetainPtr<T>& o)
{
    T optr = o.get();
    if (optr)
        JSRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        JSRelease(ptr);
    return *this;
}

template<typename T> template<typename U> inline JSRetainPtr<T>& JSRetainPtr<T>::operator=(const JSRetainPtr<U>& o)
{
    T optr = o.get();
    if (optr)
        JSRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        JSRelease(ptr);
    return *this;
}

template<typename T> inline JSRetainPtr<T>& JSRetainPtr<T>::operator=(T optr)
{
    if (optr)
        JSRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        JSRelease(ptr);
    return *this;
}

template<typename T> inline void JSRetainPtr<T>::adopt(T optr)
{
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        JSRelease(ptr);
}

template<typename T> template<typename U> inline JSRetainPtr<T>& JSRetainPtr<T>::operator=(U* optr)
{
    if (optr)
        JSRetain(optr);
    T ptr = m_ptr;
    m_ptr = optr;
    if (ptr)
        JSRelease(ptr);
    return *this;
}

template<typename T> inline void JSRetainPtr<T>::swap(JSRetainPtr<T>& o)
{
    std::swap(m_ptr, o.m_ptr);
}

template<typename T> inline void swap(JSRetainPtr<T>& a, JSRetainPtr<T>& b)
{
    a.swap(b);
}

template<typename T, typename U> inline bool operator==(const JSRetainPtr<T>& a, const JSRetainPtr<U>& b)
{ 
    return a.get() == b.get(); 
}

template<typename T, typename U> inline bool operator==(const JSRetainPtr<T>& a, U* b)
{ 
    return a.get() == b; 
}

template<typename T, typename U> inline bool operator==(T* a, const JSRetainPtr<U>& b) 
{
    return a == b.get(); 
}

template<typename T, typename U> inline bool operator!=(const JSRetainPtr<T>& a, const JSRetainPtr<U>& b)
{ 
    return a.get() != b.get(); 
}

template<typename T, typename U> inline bool operator!=(const JSRetainPtr<T>& a, U* b)
{
    return a.get() != b; 
}

template<typename T, typename U> inline bool operator!=(T* a, const JSRetainPtr<U>& b)
{ 
    return a != b.get(); 
}


#endif // JSRetainPtr_h
