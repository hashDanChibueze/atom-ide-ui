'use strict';var _asyncToGenerator = _interopRequireDefault(require('async-to-generator'));var _testHelpers;




















function _load_testHelpers() {return _testHelpers = require('../../nuclide-commons/test-helpers');}
var _rxjsBundlesRxMinJs = require('rxjs/bundles/Rx.min.js');var _ActiveEditorRegistry;

function _load_ActiveEditorRegistry() {return _ActiveEditorRegistry = _interopRequireDefault(require('../ActiveEditorRegistry'));}function _interopRequireDefault(obj) {return obj && obj.__esModule ? obj : { default: obj };}







describe('ActiveEditorRegistry', () => {
  let activeEditorRegistry =


  null;

  let activeEditors = null;
  let editorChanges = null;
  let editorSaves = null;

  let resultFunction = null;
  let config = null;
  let eventSources = null;

  let editor1 = null;
  let editor2 = null;

  let events = null;
  let eventNames = null;

  let shouldProviderError = null;

  function initializeService() {
    activeEditorRegistry = new (_ActiveEditorRegistry || _load_ActiveEditorRegistry()).default(
    resultFunction,
    config,
    eventSources);


    events = activeEditorRegistry.getResultsStream().publishReplay();
    eventNames = events.map(event => event.kind);
    events.connect();
  }

  beforeEach(() => {
    waitsForPromise((0, _asyncToGenerator.default)(function* () {
      activeEditors = new _rxjsBundlesRxMinJs.Subject();
      editorChanges = new _rxjsBundlesRxMinJs.Subject();
      editorSaves = new _rxjsBundlesRxMinJs.Subject();
      shouldProviderError = false;

      resultFunction = jasmine.createSpy().andCallFake((0, _asyncToGenerator.default)(function* () {
        if (shouldProviderError) {
          throw new Error('baaaaad');
        }
      }));
      config = {};
      eventSources = {
        activeEditors,
        changesForEditor: function () {return editorChanges;},
        savesForEditor: function () {return editorSaves;} };


      initializeService();

      editor1 = yield atom.workspace.open();
      editor2 = yield atom.workspace.open();
    }));
  });

  describe('when there is a provider', () => {
    let provider = null;
    beforeEach(() => {
      provider = {
        priority: 10,
        grammarScopes: ['text.plain.null-grammar'] };

      activeEditorRegistry.consumeProvider(provider);
    });

    it('should create correct event stream during normal use', () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        activeEditors.next(null);
        yield waitForNextTick();

        activeEditors.next(editor1);
        yield waitForNextTick();

        editorChanges.next(undefined);
        yield waitForNextTick();

        activeEditors.next(editor2);

        yield (0, (_testHelpers || _load_testHelpers()).expectObservableToStartWith)(eventNames, [
        'not-text-editor',
        'pane-change',
        'result',
        'edit',
        'result',
        'pane-change',
        'result']);


        const fullEvents = yield events.
        take(4).
        toArray().
        toPromise();
        expect(fullEvents[1]).toEqual({
          kind: 'pane-change',
          editor: editor1 });

        expect(fullEvents[2]).toEqual({
          kind: 'result',
          editor: editor1,
          provider,
          result: undefined });

        expect(fullEvents[3]).toEqual({
          kind: 'edit',
          editor: editor1 });

      }));
    });

    it('should not emit save events when it is configured to respond to edit events', () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        activeEditors.next(editor1);
        yield waitForNextTick();

        editorChanges.next(undefined);
        yield waitForNextTick();

        editorSaves.next(undefined);
        yield waitForNextTick();

        yield (0, (_testHelpers || _load_testHelpers()).expectObservableToStartWith)(eventNames, [
        'pane-change',
        'result',
        'edit',
        'result']);

      }));
    });

    describe('when configured to respond to save events', () => {
      beforeEach(() => {
        config.updateOnEdit = false;
        initializeService();
        // Have to re-add this since the re-initialization kills it
        activeEditorRegistry.consumeProvider({
          priority: 10,
          grammarScopes: ['text.plain.null-grammar'] });

      });

      it('should generate and respond to save events', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          activeEditors.next(editor1);
          yield waitForNextTick();

          editorChanges.next(undefined);
          yield waitForNextTick();

          editorSaves.next(undefined);
          yield waitForNextTick();

          yield (0, (_testHelpers || _load_testHelpers()).expectObservableToStartWith)(eventNames, [
          'pane-change',
          'result',
          'save',
          'result']);


          const fullEvents = yield events.
          take(3).
          toArray().
          toPromise();
          expect(fullEvents[2]).toEqual({
            kind: 'save',
            editor: editor1 });

        }));
      });
    });

    describe('when given providers with different updateOnEdit settings', () => {
      beforeEach(() => {
        initializeService();
        // Have to re-add this since the re-initialization kills it
        activeEditorRegistry.consumeProvider({
          priority: 10,
          grammarScopes: ['text.plain.null-grammar'] });

        activeEditorRegistry.consumeProvider({
          priority: 10,
          grammarScopes: ['source.cpp'],
          updateOnEdit: false });

        spyOn(editor2, 'getGrammar').andReturn({
          scopeName: 'source.cpp' });

      });

      it('should generate and respond to the appropriate event', () => {
        waitsForPromise((0, _asyncToGenerator.default)(function* () {
          activeEditors.next(editor1);
          yield waitForNextTick();

          editorChanges.next(undefined);
          yield waitForNextTick();

          editorSaves.next(undefined);
          yield waitForNextTick();

          activeEditors.next(editor2);
          yield waitForNextTick();

          editorChanges.next(undefined);
          yield waitForNextTick();

          editorSaves.next(undefined);
          yield waitForNextTick();

          yield (0, (_testHelpers || _load_testHelpers()).expectObservableToStartWith)(eventNames, [
          'pane-change',
          'result',
          'edit',
          'result',
          'pane-change',
          'result',
          'save',
          'result']);

        }));
      });
    });

    it("should produce the 'provider-error' event when a provider errors", () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        shouldProviderError = true;

        activeEditors.next(editor1);
        yield waitForNextTick();

        yield (0, (_testHelpers || _load_testHelpers()).expectObservableToStartWith)(eventNames, [
        'pane-change',
        'provider-error']);


        expect((yield events.elementAt(1).toPromise())).toEqual({
          kind: 'provider-error',
          provider });

      }));
    });

    it('should immediately query a better provider', () => {
      const betterProvider = {
        priority: 20,
        grammarScopes: ['text.plain.null-grammar'] };


      activeEditors.next(editor1);
      expect(resultFunction).toHaveBeenCalledWith(provider, editor1);
      activeEditorRegistry.consumeProvider(betterProvider);
      expect(resultFunction).toHaveBeenCalledWith(betterProvider, editor1);
    });
  });

  describe('when there is no provider', () => {
    it("should produce the 'no-provider' result when there is no provider", () => {
      waitsForPromise((0, _asyncToGenerator.default)(function* () {
        activeEditors.next(editor1);
        yield waitForNextTick();

        yield (0, (_testHelpers || _load_testHelpers()).expectObservableToStartWith)(eventNames, [
        'pane-change',
        'no-provider']);

      }));
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
     * 
     * @format
     */function waitForNextTick() {return new Promise(resolve => process.nextTick(resolve));}