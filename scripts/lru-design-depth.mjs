export const lruDesignDepth = `<section class="card mechanism-walkthrough" id="lru-system-design">
<h2>Interview walkthrough: design an LRU cache</h2>
<p>LRU means least recently used. Imagine a desk with room for two books. Reading a book makes it the most recent. When a third book arrives, remove the book you have gone longest without using. This predicts future usefulness from recent access; it does not guarantee the best choice.</p>
<h3>Clarify the contract first</h3>
<p>Ask whether the interviewer wants an in-process data structure or a distributed cache service. Start with a local cache unless a network service is required. Agree on capacity units, valid keys, miss behaviour, update behaviour, concurrent access, and freshness.</p>
<ul><li>For this example, capacity is a positive integer number of entries, not bytes.</li><li>Keys are immutable strings. Values may include None and are returned by reference.</li><li>get(key) returns (found, value). A miss does not change recency.</li><li>put(key, value) inserts or replaces a value and makes it most recent. Replacing a key does not increase the entry count.</li><li>Both operations are serialized by one lock within this process. There is no TTL, persistence, loader, or cross-process coordination.</li></ul>
<h3>Choose the structures</h3>
<p>A hash map finds the entry by key in expected constant time. A doubly linked list records recency. Each node holds a key, value, previous link, and next link. The map points directly to its node, so you do not scan the list to find it.</p>
<pre>Map: key → node
List: head ⇄ least recent ⇄ ... ⇄ most recent ⇄ tail

get hit: find node → unlink it → insert before tail → return value
put existing: replace value → move node before tail
put new: insert node and map entry → evict head.next if over capacity</pre>
<p>Head and tail can be sentinel nodes to simplify empty-list boundaries. Unlinking a node updates both neighbouring links. Eviction removes the same key from the map. The invariants are: one list node per map entry, matching membership in both structures, correct links, and size at most capacity after an operation.</p>
<p>A plain list needs a scan or shifts to update a middle entry. A heap generally makes recency updates logarithmic and adds bookkeeping. The map plus linked list gives expected O(1) lookup and O(1) link updates, with O(capacity) entries and metadata. Hashing costs and lock waits are not constant-time guarantees.</p>
<h3>Work through a capacity of two</h3>
<pre>Operation       Order: least → most recent       Result
put(A, 1)       A
put(B, 2)       A, B
get(A)          B, A                             hit: 1
put(C, 3)       A, C                             evict B
put(A, 9)       C, A                             update, no eviction
get(B)          C, A                             miss</pre>
<p>Reading A protects it from the next eviction. Writing an existing A changes its value and recency, not the number of entries. Read this trace before trying the implementation.</p>
<h3>A small implementation to test</h3>
<p>OrderedDict supplies reordering and oldest-entry removal, so the runnable version does not duplicate its linked-order machinery. If the interviewer prohibits it, implement the map and list operations described above.</p>
<pre data-lru-design-example><code>from collections import OrderedDict
from threading import Lock

class LRUCache:
    def __init__(self, capacity):
        if type(capacity) is not int or capacity &lt; 1:
            raise ValueError("capacity must be a positive integer")
        self._capacity = capacity
        self._data = OrderedDict()
        self._lock = Lock()

    def get(self, key):
        if type(key) is not str:
            raise TypeError("key must be a string")
        with self._lock:
            if key not in self._data:
                return False, None
            self._data.move_to_end(key)
            return True, self._data[key]

    def put(self, key, value):
        if type(key) is not str:
            raise TypeError("key must be a string")
        with self._lock:
            self._data[key] = value
            self._data.move_to_end(key)
            if len(self._data) &gt; self._capacity:
                self._data.popitem(last=False)

cache = LRUCache(2)
cache.put("A", 1)
cache.put("B", 2)
assert cache.get("A") == (True, 1)
cache.put("C", 3)
assert cache.get("B") == (False, None)
cache.put("A", 9)
assert len(cache._data) == 2
assert list(cache._data) == ["C", "A"]
assert cache.get("A") == (True, 9)

single = LRUCache(1)
single.put("empty", None)
assert single.get("empty") == (True, None)
assert single.get("missing") == (False, None)
single.put("next", 2)
assert single.get("empty") == (False, None)

for bad in (0, -1, True, 1.5):
    try:
        LRUCache(bad)
    except ValueError:
        pass
    else:
        raise AssertionError("invalid capacity accepted")
try:
    cache.get([])
except TypeError:
    pass
else:
    raise AssertionError("invalid key accepted")</code></pre>
<p>The found flag distinguishes a cached None from a miss. The lock protects a complete get or put, including recency changes. Returned mutable values are not protected after the call; prefer immutable values or define copying and ownership rules. This teaching fixture is not a hardened cache library for arbitrary objects with callbacks or finalizers.</p>
<h3>Concurrency and cache loading</h3>
<p>A hit changes recency, so reads need synchronization too. Do not rely on the GIL to protect multi-step invariants. A single lock is easy to reason about but can become a contention point. Sharding gives each partition its own lock and capacity; eviction is then local to a shard, not globally exact LRU.</p>
<p>A sequence of get, database load, and put is not atomic just because each cache method is locked. Several callers can miss together. A per-key in-flight request can let them share one load, called single-flight. Keep slow I/O outside the cache lock, bound waits, and clear in-flight state on failure. Define what happens if a newer write occurs while an older load is still running; version checks or coordinated invalidation may be needed.</p>
<h3>Eviction is not expiration</h3>
<p>LRU chooses a victim when capacity is needed. TTL makes a value unusable after a deadline, even when the cache has free space. They can coexist. In a local TTL extension, store an expiry deadline using a monotonic clock, reject expired values on get, and choose a cleanup policy. Removing expired entries lazily leaves memory occupied until access or cleanup. A deadline heap adds maintenance costs, so do not keep claiming every operation is O(1).</p>
<p>Neither LRU nor TTL alone guarantees current data. Discuss writes, invalidation, versioning, and the acceptable stale-data window. For price or risk data, agree explicitly whether a stale response is safe; do not silently substitute it.</p>
<h3>When LRU performs poorly</h3>
<p>A one-time scan can fill the cache with cold entries and evict the hot working set. A cyclic workload of three keys in a capacity-two LRU can miss on every access. Measure your access pattern before choosing a policy. FIFO avoids hit-time recency updates but ignores recent use. LFU favours frequency but needs aging to adapt to changing popularity. Admission filters or segmented policies can resist scans, at the cost of more bookkeeping.</p>
<h3>If the interviewer asks for a distributed service</h3>
<p>First explain why a process-local cache is insufficient. Partition keys across cache nodes and define routing, failure recovery, rebalancing, and per-node capacity. A global exact recency order would require coordination; per-node or approximate eviction is usually a different, explicit contract. Replication, freshness, and source-of-truth writes need separate decisions.</p>
<p>Budget bytes, not just keys: include key and value sizes, metadata, allocator overhead, and safety headroom. Reject or bypass oversized entries. Scope keys by tenant and permissions where needed. On cache failure, bound source traffic so fallback does not overload the database. Monitor hit ratio, evictions versus expirations, memory, load latency, lock wait, and tail latency. A high hit ratio alone does not prove correctness or a useful latency improvement.</p>
<h3>Practise the changed constraint</h3>
<p>Repeat the capacity-two trace without get(A). Predict the victim when C arrives.</p>
<details><summary>Answer</summary><p>A is evicted. B was the more recent insertion. Now add get(A) back and explain why B becomes the victim.</p></details>
<details><summary>Interview: What would you test beyond the happy path?</summary><p>Capacity one, invalid capacity, empty misses, cached None, repeated updates, repeated hits, and eviction after a hit. Compare random operation sequences with a simple reference model. For a manual linked list, inspect membership and both link directions after every operation. Add controlled concurrent tests for atomic operations; ordinary load tests alone do not prove correctness.</p></details>
<details><summary>Interview: Why not always use exact LRU in Redis?</summary><p>Redis uses sampled approximate LRU to trade precision for overhead. Do not claim the local exact-order implementation describes Redis's internal eviction algorithm. Choose settings based on the deployed product and measured workload.</p></details>
<details><summary>Interview: What is the concise design answer?</summary><p>Clarify a bounded local cache with explicit miss semantics. Use a map to locate nodes and a doubly linked list for recency. Move hits and updates to the recent end; evict from the old end. Protect the combined operation under concurrency. Then discuss capacity in bytes, TTL, stale fills, and sharding only when required.</p></details>
<p>Ask your teacher to change one requirement after your explanation. Rehearse the trace tomorrow without notes.</p>
<p>Sources: <a href="https://docs.python.org/3/library/collections.html#collections.OrderedDict">OrderedDict operations</a> · <a href="https://redis.io/docs/latest/develop/reference/eviction/">Redis eviction policies and approximate LRU</a>.</p>
</section>`;
