'use strict';var _BatchProcessedQueue;











function _load_BatchProcessedQueue() {return _BatchProcessedQueue = _interopRequireDefault(require('../BatchProcessedQueue'));}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

describe('analytics - BatchProcessedQueue', () => {
  it('regular operation', () => {
    const handler = jasmine.createSpy('handler');
    const queue = new (_BatchProcessedQueue || _load_BatchProcessedQueue()).default(5000, handler);

    queue.add(1);
    queue.add(2);
    queue.add(3);
    queue.add(4);
    queue.add(5);
    expect(handler).not.toHaveBeenCalled();

    advanceClock(4999);
    expect(handler).not.toHaveBeenCalled();
    advanceClock(1);
    expect(handler).toHaveBeenCalledWith([1, 2, 3, 4, 5]);

    queue.add(42);
    advanceClock(10000);
    expect(handler).toHaveBeenCalledWith([42]);
  });
}); /**
     * Copyright (c) 2017-present, Facebook, Inc.
     * All rights reserved.
     *
     * This source code is licensed under the BSD-style license found in the
     * LICENSE file in the root directory of this source tree. An additional grant
     * of patent rights can be found in the PATENTS file in the same directory.
     *
     *  strict
     * @format
     */