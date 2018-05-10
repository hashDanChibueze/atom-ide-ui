'use strict';var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));











var _atom = require('atom');
var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');var _debounced;
function _load_debounced() {return _debounced = require('../debounced');}var _goToLocation;






function _load_goToLocation() {return _goToLocation = require('../go-to-location');}var _promise;

function _load_promise() {return _promise = require('../../nuclide-commons/promise');}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}

// Shorter than the default so the tests don't run long.
const DEBOUNCE_INTERVAL = 10;
// Longer than DEBOUNCE_INTERVAL so when we wait for this amount of time, a debounced event will be
// emitted.
/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * 
 * @format
 */const SLEEP_INTERVAL = 15; // Sleep interval for double the debounce interval.
const SLEEP_INTERVAL_2 = 25; // eslint-disable-next-line jasmine/no-disabled-tests
xdescribe('editorScrollTopDebounced', () => {it('debounces scroll event', () => {const LINES = 1000;const mockText = Array(LINES).fill('MOCK LINE\n').reduce((a, b) => a.concat(b));waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const editor = yield atom.workspace.open();
      editor.setText(mockText);

      const editorScroll = (0, (_debounced || _load_debounced()).editorScrollTopDebounced)(editor, DEBOUNCE_INTERVAL);

      const eventsPromise = editorScroll.
      takeUntil(_rxjsBundlesRxMinJs.Observable.of(null).delay(500)).
      toArray().
      toPromise();

      editor.scrollToBufferPosition(new _atom.Point(LINES / 2, 0));
      editor.scrollToBufferPosition(new _atom.Point(0, 0));
      editor.scrollToBufferPosition(new _atom.Point(LINES - 1, 0));
      editor.scrollToBufferPosition(new _atom.Point(LINES / 4, 0));

      const events = yield eventsPromise;

      expect(events.length).toBe(1);

      editor.destroy();
    }));
  });
});

// eslint-disable-next-line jasmine/no-disabled-tests
xdescribe('pane item change events', () => {
  let pane = null;
  let editor1 = null;
  let editor2 = null;
  let editor3 = null;
  let nonEditor = null;
  let activePaneItems = null;

  beforeEach(() => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      // Since RX manages to dodge the built-in clock mocking we'll use the real clock for these
      // tests :(
      jasmine.useRealClock();

      editor3 = yield atom.workspace.open();
      editor2 = yield atom.workspace.open();
      editor1 = yield atom.workspace.open();

      pane = atom.workspace.getActivePane();
      nonEditor = {
        // Ordinarily we would have to provide an element or register a view, but since we are just
        // testing the model here and not actually rendering anything Atom doesn't complain. If
        // these tests start failing because Atom can't find a view, look here.
        getTitle() {
          return 'foo';
        } };

      pane.addItem(nonEditor);
      pane.activateItem(editor1);
    }));
  });

  describe('observeActivePaneItemDebounced', () => {
    beforeEach(() => {
      activePaneItems = (0, (_debounced || _load_debounced()).observeActivePaneItemDebounced)(DEBOUNCE_INTERVAL);
    });

    it('should issue an initial item', () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        expect((
        yield activePaneItems.
        first()
        // Split out an empty observable after waiting 20 ms.
        .race(_rxjsBundlesRxMinJs.Observable.empty().delay(20)).
        toArray().
        toPromise())).
        toEqual([editor1]);
      }));
    });

    it('should debounce', () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        const itemsPromise = activePaneItems.
        take(2).
        toArray().
        toPromise();

        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL);

        pane.activateItem(editor2);
        pane.activateItem(editor3);

        expect((yield itemsPromise)).toEqual([editor1, editor3]);
      }));
    });
  });

  describe('observeActiveEditorsDebounced', () => {
    let activeEditors = null;
    beforeEach(() => {
      activeEditors = (0, (_debounced || _load_debounced()).observeActiveEditorsDebounced)(DEBOUNCE_INTERVAL);
    });

    it('should return null if the item is not an editor', () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        const itemsPromise = activeEditors.
        take(3).
        toArray().
        toPromise();

        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL);
        pane.activateItem(nonEditor);

        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL);
        pane.activateItem(editor2);

        expect((yield itemsPromise)).toEqual([editor1, null, editor2]);
      }));
    });
  });

  describe('observeTextEditorsPositions', () => {
    it('cursor moves and non-editors', () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        const itemsPromise = (0, (_debounced || _load_debounced()).observeTextEditorsPositions)(
        DEBOUNCE_INTERVAL,
        DEBOUNCE_INTERVAL).

        take(5).
        toArray().
        toPromise();
        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL_2);
        (0, (_goToLocation || _load_goToLocation()).goToLocationInEditor)(editor1, { line: 3, column: 4 });
        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL_2);
        pane.activateItem(nonEditor);
        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL_2);
        (0, (_goToLocation || _load_goToLocation()).goToLocationInEditor)(editor1, { line: 0, column: 0 });
        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL_2);
        pane.activateItem(editor2);
        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL_2);
        (0, (_goToLocation || _load_goToLocation()).goToLocationInEditor)(editor1, { line: 3, column: 4 });
        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL_2);
        (0, (_goToLocation || _load_goToLocation()).goToLocationInEditor)(editor2, { line: 1, column: 1 });
        yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL_2);

        expect((yield itemsPromise)).toEqual([
        {
          editor: editor1,
          position: new _atom.Point(4, 0) },

        {
          editor: editor1,
          position: new _atom.Point(3, 4) },

        null,
        {
          editor: editor2,
          position: new _atom.Point(3, 0) },

        {
          editor: editor2,
          position: new _atom.Point(1, 1) }]);


      }));
    });
  });
});

// eslint-disable-next-line jasmine/no-disabled-tests
xdescribe('editorChangesDebounced', () => {
  let editor = null;
  let editorChanges = null;

  beforeEach(() => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      jasmine.useRealClock();
      editor = yield atom.workspace.open();
      editorChanges = (0, (_debounced || _load_debounced()).editorChangesDebounced)(editor, DEBOUNCE_INTERVAL);
    }));
  });

  it('debounces changes', () => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      const eventsPromise = editorChanges.
      takeUntil(_rxjsBundlesRxMinJs.Observable.of(null).delay(50)).
      toArray().
      toPromise();

      yield (0, (_promise || _load_promise()).sleep)(SLEEP_INTERVAL);

      editor.insertNewline();
      editor.insertNewline();

      expect((yield eventsPromise).length).toBe(1);
    }));
  });
});