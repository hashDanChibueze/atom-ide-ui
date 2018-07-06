/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow
 * @format
 */

import type {IThread, IDebugService} from '../types';

import {TreeItem, NestedTreeItem} from 'nuclide-commons-ui/Tree';
import * as React from 'react';

type Props = {
  thread: IThread,
  service: IDebugService,
  childItems: Array<React.Element<any>>,
  title: string,
};

type State = {
  isCollapsed: boolean,
};

export default class ThreadTreeNode extends React.Component<Props, State> {
  isFocused: boolean;

  constructor(props: Props) {
    super(props);
    this.updateFocused();
    this.state = {
      isCollapsed: !this.isFocused,
    };
    this.handleSelect = this.handleSelect.bind(this);
  }

  updateFocused() {
    const {service, thread} = this.props;
    const focusedThread = service.viewModel.focusedThread;
    this.isFocused =
      focusedThread == null
        ? false
        : thread.threadId === focusedThread.threadId;
  }

  componentDidUpdate(prevProps: Props, prevState: State) {
    // Handle the scenario when the user stepped or continued running.
    this.updateFocused();
    if (prevState === this.state) {
      this.setState({
        isCollapsed: !(this.isFocused || !prevState.isCollapsed),
      });
    }
  }

  handleSelect = async () => {
    if (this.props.childItems.length === 0) {
      await this.props.thread.fetchCallStack();
    }
    this.setState(prevState => ({
      isCollapsed: !prevState.isCollapsed,
    }));
  };

  handleSelectNoChildren = () => {
    this.props.service.focusStackFrame(null, this.props.thread, null, true);
  };

  render(): React.Node {
    const {thread, title, childItems} = this.props;
    this.updateFocused;

    const formattedTitle = (
      <span
        className={
          this.isFocused ? 'debugger-tree-process-thread-selected' : ''
        }
        title={'Thread ID: ' + thread.threadId + ', Name: ' + thread.name}>
        {title}
      </span>
    );

    return childItems == null || childItems.length === 0 ? (
      <TreeItem onSelect={this.handleSelectNoChildren}>
        {formattedTitle}
      </TreeItem>
    ) : (
      <NestedTreeItem
        title={formattedTitle}
        collapsed={this.state.isCollapsed}
        onSelect={this.handleSelect}>
        {childItems}
      </NestedTreeItem>
    );
  }
}
