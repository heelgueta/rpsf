/* playtest logging hook. no-op until configured (see README). */
(function (root) {
  'use strict';
  const T = { enabled: false, sink: null };
  T.log = function (record) {
    try { if (T.enabled && T.sink) T.sink(record); } catch (e) { /* never break the game */ }
  };
  root.RPSTelemetry = T;
})(typeof self !== 'undefined' ? self : this);
