
/**
 * Copyright (c) 2015, Facebook, Inc.  All rights reserved.
 *
 * Facebook, Inc. ("Facebook") owns all right, title and interest, including
 * all intellectual property and other proprietary rights, in and to the React
 * Native CustomComponents software (the "Software").  Subject to your
 * compliance with these terms, you are hereby granted a non-exclusive,
 * worldwide, royalty-free copyright license to (1) use and copy the Software;
 * and (2) reproduce and distribute the Software as part of your own software
 * ("Your Software").  Facebook reserves all rights not expressly granted to
 * you in this license agreement.
 *
 * THE SOFTWARE AND DOCUMENTATION, IF ANY, ARE PROVIDED "AS IS" AND ANY EXPRESS
 * OR IMPLIED WARRANTIES (INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES
 * OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE) ARE DISCLAIMED.
 * IN NO EVENT SHALL FACEBOOK OR ITS AFFILIATES, OFFICERS, DIRECTORS OR
 * EMPLOYEES BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL,
 * EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
 * PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS;
 * OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY,
 * WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR
 * OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THE SOFTWARE, EVEN IF
 * ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */
'use strict';

jest
  .dontMock('NavigationEvent')
  .dontMock('fbjs/lib/invariant');

var NavigationEvent = require('NavigationEvent');

describe('NavigationEvent', () => {
  it('constructs', () => {
    var target = {};
    var event = new NavigationEvent('foo', target, 123);
    expect(event.type).toBe('foo');
    expect(event.target).toBe(target);
    expect(event.data).toBe(123);
  });

  it('constructs from pool', () => {
    var target = {};
    var event = NavigationEvent.pool('foo', target, 123);
    expect(event.type).toBe('foo');
    expect(event.target).toBe(target);
    expect(event.data).toBe(123);
  });

  it('prevents default', () => {
    var event = new NavigationEvent('foo', {}, 123);
    expect(event.defaultPrevented).toBe(false);
    event.preventDefault();
    expect(event.defaultPrevented).toBe(true);
  });

  it('recycles', () => {
    var event1 = NavigationEvent.pool('foo', {}, 123);
    event1.dispose();
    expect(event1.type).toBe(null);
    expect(event1.data).toBe(null);
    expect(event1.target).toBe(null);

    var event2 = NavigationEvent.pool('bar', {}, 456);
    expect(event2.type).toBe('bar');
    expect(event2).toBe(event1);
  });
});


