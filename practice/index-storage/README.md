# Index storage reasoning — offline

Read [the reference](../../reference/index-storage-design.html) first. From the
repository root, run only the standard-library exercise:

```sh
python3 -B practice/index-storage/exercise.py -v
```

Six tests cover range boundaries, invalid ranges, newest-version selection,
tombstone lookup, unsafe deletion-marker removal and a complete no-snapshot merge.
No package or database installation is needed. No database connection is made.

These are in-memory result models. The sorted list is not a B+ tree; dictionaries
are not SSTables. None stores a WAL, implements snapshots, simulates page splits,
performs crash recovery or measures performance. `None` is reserved for deletion,
not a stored application value. Runs are supplied newest-first, with simple
whole-run chronology; real engines resolve versions using sequence/visibility
metadata. Complete compaction removes tombstones only under the stated assumption
that all older data is included and no snapshot needs it.

Next: use an existing disposable database to compare covered/uncovered query
plans and maintenance cost. Do not run CLUSTER or create production indexes merely
to follow this page. Engine plans, storage layouts and LSM load behavior remain
separate, unexecuted integration work.
