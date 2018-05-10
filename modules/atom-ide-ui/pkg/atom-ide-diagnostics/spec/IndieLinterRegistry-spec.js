'use strict';var _IndieLinterRegistry;











function _load_IndieLinterRegistry() {return _IndieLinterRegistry = _interopRequireDefault(require('../lib/services/IndieLinterRegistry'));}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('IndieLinterRegistry', () => {
  const registry = new (_IndieLinterRegistry || _load_IndieLinterRegistry()).default();
  const message1 = {
    location: {
      file: 'test.txt',
      position: [[0, 0], [0, 0]] },

    excerpt: 'test',
    severity: 'error' };

  const message2 = {
    location: {
      file: 'test2.txt',
      position: [[0, 0], [0, 0]] },

    excerpt: 'test2',
    severity: 'error' };


  let delegate;
  beforeEach(() => {
    delegate = registry.register({ name: 'test' });
  });

  afterEach(() => {
    delegate.dispose();
    expect(registry._delegates.size).toBe(0);
  });

  describe('IndieLinterDelegate', () => {
    it('has a name', () => {
      expect(delegate.name).toBe('test');
    });

    it('supports message APIs', () => {
      expect(delegate.getMessages()).toEqual([]);

      delegate.setMessages('test.txt', [message1]);
      expect(delegate.getMessages()).toEqual([message1]);

      // Replaces the previous message.
      delegate.setMessages('test.txt', [message1]);
      expect(delegate.getMessages()).toEqual([message1]);

      // Doesn't affect existing files.
      delegate.setMessages('test2.txt', [message2]);
      expect(delegate.getMessages()).toEqual([message1, message2]);

      delegate.setAllMessages([message1]);
      expect(delegate.getMessages()).toEqual([message1]);

      delegate.clearMessages();
      expect(delegate.getMessages()).toEqual([]);
    });

    it('supports onDidChange', () => {
      const spy = jasmine.createSpy();
      delegate.onDidUpdate(spy);
      delegate.setMessages('test.txt', [message1]);
      expect(spy).toHaveBeenCalledWith([message1]);
    });

    it('supports onDidDestroy', () => {
      const spy = jasmine.createSpy();
      delegate.onDidDestroy(spy);
      expect(spy.callCount).toBe(0);
      delegate.dispose();
      delegate.dispose();
      expect(spy.callCount).toBe(1);
    });
  });
}); /**
     * Copyright (c) 2017-present, Facebook, Inc.
     * All rights reserved.
     *
     * This source code is licensed under the BSD-style license found in the
     * LICENSE file in the root directory of this source tree. An additional grant
     * of patent rights can be found in the PATENTS file in the same directory.
     *
     *  strict-local
     * @format
     */