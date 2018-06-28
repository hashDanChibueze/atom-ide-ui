/**
 * Copyright (c) 2017-present, Facebook, Inc.
 * All rights reserved.
 *
 * This source code is licensed under the BSD-style license found in the
 * LICENSE file in the root directory of this source tree. An additional grant
 * of patent rights can be found in the PATENTS file in the same directory.
 *
 * @flow strict-local
 * @format
 */

import type {Expected} from 'nuclide-commons/expected';
import type {NuclideUri} from 'nuclide-commons/nuclideUri';
import type {AdbDevice} from './types';

import {getLogger} from 'log4js';
import {arrayEqual} from 'nuclide-commons/collection';
import {SimpleCache} from 'nuclide-commons/SimpleCache';
// $FlowIgnore untyped import
import shallowEqual from 'shallowequal';
import {Observable} from 'rxjs';
import {Expect, expectedEqual} from 'nuclide-commons/expected';
import nuclideUri from 'nuclide-commons/nuclideUri';
import {getAdbServiceByNuclideUri} from './utils';

export function observeAndroidDevices(
  host: NuclideUri,
): Observable<Expected<Array<AdbDevice>>> {
  const serviceUri = nuclideUri.isRemote(host)
    ? nuclideUri.createRemoteUri(nuclideUri.getHostname(host), '/')
    : '';
  return pollersForUris.getOrCreate(serviceUri, () => {
    let fetching = false;
    return Observable.interval(2000)
      .startWith(0)
      .filter(() => !fetching)
      .switchMap(() => {
        fetching = true;
        return Observable.fromPromise(
          getAdbServiceByNuclideUri(serviceUri).getDeviceList(),
        )
          .map(devices => Expect.value(devices))
          .catch(err => {
            const logger = getLogger('nuclide-adb');
            if (err.stack.startsWith('TimeoutError')) {
              logger.debug('Error polling for devices: ' + err.message);
            } else {
              logger.warn('Error polling for devices: ' + err.message);
            }
            return Observable.of(
              Expect.error(
                new Error("Can't fetch Android devices.\n\n" + err.message),
              ),
            );
          })
          .do(() => {
            fetching = false;
          });
      })
      .distinctUntilChanged((a, b) =>
        expectedEqual(
          a,
          b,
          (v1, v2) => arrayEqual(v1, v2, shallowEqual),
          (e1, e2) => e1.message === e2.message,
        ),
      )
      .publishReplay(1)
      .refCount();
  });
}

// This is a convenient way for any device panel plugins of type Android to get from Device to
// to the strongly typed AdbDevice.
export async function adbDeviceForIdentifier(
  host: NuclideUri,
  identifier: string,
): Promise<?AdbDevice> {
  const devices = await observeAndroidDevices(host)
    .take(1)
    .toPromise();
  return devices.getOrDefault([]).find(d => d.serial === identifier);
}

const pollersForUris: SimpleCache<
  string,
  Observable<Expected<Array<AdbDevice>>>,
> = new SimpleCache();
