// Individually authored explanation repairs. Absence means not yet rewritten.
export const EXPLANATION_REWRITES = {
  "0265": {
    foundation: "An RFQ can have several legs, each with its own quantity. You might keep those quantities in a list, update one, then copy the list for a calculation. Whether that copy protects the original depends on what the list contains. This lesson follows those changes through lists and nested lists, then looks at tuples and ranges. All three are sequences: they keep their values in order, though the operations they support differ.",
    profile: {
      analogy: "When two lists share a nested list, changing that nested list affects both. Replacing an item in one outer list affects only that outer list. The difference is which object you change.",
      sourceLabel: "Python: sequence types and operations",
      sourceUrl: "https://docs.python.org/3/library/stdtypes.html#sequence-types-list-tuple-range",
      labScope: "This example uses only the Python standard library. Predict whether each assertion will pass before running it. It checks the behavior described here; it does not measure performance.",
      code: `from copy import deepcopy
from collections import deque

quantities = [10, 20, 30]
alias = quantities
alias.append(40)
assert quantities == [10, 20, 30, 40]
assert alias is quantities

outer_copy = quantities[:]
outer_copy[0] = 99
assert quantities[0] == 10
assert outer_copy is not quantities

legs = [[10, 20], [30]]
shallow = legs.copy()
independent = deepcopy(legs)
shallow[0].append(99)
assert legs == [[10, 20, 99], [30]]
assert independent == [[10, 20], [30]]
shallow[1] = [70]
assert legs[1] == [30]

record = ("RFQ-1", [10, 20])
record[1].append(30)
assert record == ("RFQ-1", [10, 20, 30])
try:
    record[0] = "RFQ-2"
except TypeError:
    pass
else:
    raise AssertionError("Tuple slot replacement must fail")

assert quantities[1:3] == [20, 30]
assert quantities[99:] == []
assert quantities[::-1] == [40, 30, 20, 10]
first, *middle, last = range(5)
assert (first, middle, last) == (0, [1, 2, 3], 4)
assert list(range(2, 9, 3)) == [2, 5, 8]
queue = deque(["a", "b"])
assert queue.popleft() == "a"`,
      checkpoint: "Assignment shares the original list. A shallow copy separates outer slots only. Mutation of a shared child reaches both views; replacement of a copied outer slot does not. The tuple permits child mutation but rejects slot replacement."
    },
    mechanism: `<h2>Reading and updating a list</h2>
<p>In quantities = [10, 20, 30], the first item is quantities[0], which gives 10. Python counts indexes from zero. A negative index counts from the other end, so quantities[-1] gives 30.</p>
<p>You can replace the second item with quantities[1] = 25, or add an item at the end with append(40). This ability to change a list after creating it is what mutable means.</p>
<h2>What happens when you copy a list?</h2>
<pre><code>quantities = [10, 20, 30]
alias = quantities
alias.append(40)
print(quantities)  # [10, 20, 30, 40]

outer_copy = quantities[:]
outer_copy[0] = 99
print(quantities[0])  # 10
print(outer_copy[0])  # 99</code></pre>
<p>After alias = quantities, both names refer to the same list. That is why appending through alias also changes what you see through quantities: [10, 20, 30, 40]. In the practice code, alias is quantities checks whether the two names refer to the very same object. Two separate lists could contain equal values without passing that check.</p>
<p>The slice quantities[:] creates a separate list. You can replace outer_copy[0] with 99 and leave quantities[0] at 10. For this list of numbers, that gives you the independence you need. With a list inside the list, there is another object to account for:</p>
<pre><code>legs = [[10, 20], [30]]
shallow = legs.copy()
shallow[0].append(99)
print(legs)  # [[10, 20, 99], [30]]

shallow[1] = [70]
print(legs[1])     # [30]
print(shallow[1])  # [70]</code></pre>
<p>legs.copy() copies the outer list. It leaves the two inner lists shared. So shallow[0].append(99) changes the first inner list, and you see [10, 20, 99] through both legs and shallow. This is a shallow copy.</p>
<p>The next assignment, shallow[1] = [70], does something different. It replaces the second item in shallow with a new list. Nothing changes the second item in legs, which still holds [30]. Follow the brackets when reading these lines: are you replacing an outer item, or changing the list that item refers to?</p>
<p>In the full example, deepcopy also copies the inner lists, so independent stays unchanged. That can be useful when a calculation needs to change nested data. It can also copy far more than the calculation needs, and some resources cannot meaningfully be copied. Decide what the caller may change before choosing between a deep copy, copying just the affected part, or an immutable data model. See <a href="https://docs.python.org/3/library/copy.html">Python's copying rules</a>.</p>
<h2>Tuples can contain mutable objects</h2>
<p>Consider record = ("RFQ-1", [10, 20]). You cannot replace either of its two items: record[0] = "RFQ-2" raises TypeError. But record[1].append(30) works. It changes the list already held in the second position, without replacing that position.</p>
<p>A tuple like this therefore cannot serve as an immutable snapshot. It also cannot be a dictionary key, because its list item is unhashable.</p>
<h2>Slices, ranges and unpacking</h2>
<p>A slice uses start:stop:step. The stop index is excluded. quantities[1:3] selects indexes 1 and 2, giving [20, 30]. quantities[::-1] walks backward and produces a reversed list. Slice bounds can extend past the sequence, so quantities[99:] is empty. In contrast, directly reading quantities[99] raises IndexError. A zero slice step raises ValueError.</p>
<p>A range describes an integer progression. range(2, 9, 3) yields 2, 5 and 8; the stop value 9 is excluded. It does not store a separate item for every integer in the progression. Converting it to a list allocates those items. Slicing a range produces another compact range, so do not apply list-copy costs to it.</p>
<p>Unpacking assigns successive values to names. first, *middle, last = range(5) assigns 0 to first, [1, 2, 3] to middle and 4 to last. The starred target receives a list. Without a starred target, the number of values must match the number of targets. Too few or too many values raise ValueError; silently ignoring extra fields requires an explicit rule.</p>
<h2>Why some list operations cost more</h2>
<p>CPython stores a list's references in a resizable array. An index identifies a position directly. Appending is usually cheap, but occasionally the array must grow and copy its references. Spread over many appends, that extra work gives an amortized constant cost per append. Individual appends can still take different amounts of time.</p>
<p>Inserting at the front requires shifting the existing references. The longer the list, the more work that takes. A slice of k items also copies k references into new outer storage, so its time and space costs grow with the slice size.</p>
<p>For a FIFO job queue, removing the first list item over and over pays that shifting cost repeatedly. deque supports efficient operations at both ends: append adds a job and popleft removes the oldest. A list is still useful when you need direct indexed access. These operation costs help you choose a container; you would need measurements to establish latency in your own application. See <a href="https://docs.python.org/3/tutorial/datastructures.html#using-lists-as-queues">the queue example</a>.</p>`,
    reading: "Work through one block at a time and write down the values you expect. For the copies, also ask which names share an object. The tuple example catches TypeError deliberately so the remaining checks can run. The code has not been run as part of this prose edit.",
    pitfalls: [
      ["A report changes its source", "A shallow copy still shares nested legs. Copy the mutable part that the calculation owns, or avoid mutating source data. Verify both source and result after the calculation."],
      ["Repeated rows share storage", "[[0] * 3] * 3 repeats references to one row. Changing one cell appears in every row. [[0] * 3 for _ in range(3)] creates a separate row each time."],
      ["Copying becomes the bottleneck", "Repeated slices in a loop allocate new lists. Pass index bounds when the algorithm does not need independent storage; do not change ownership semantics merely to remove allocations."]
    ],
    rehearsal: "An RFQ risk calculation copies a list of legs, changes one nested quantity and unexpectedly changes the original RFQ. Trace the shared object, propose the smallest ownership fix and explain when deepcopy would be excessive. Then replace a FIFO list queue with deque and justify the operation costs.",
    answer: "The outer list was copied, but the nested leg remained shared. Copy the nested mutable data the calculation must change, or derive new output without source mutation. Test source preservation as well as the computed result. deque avoids repeated front shifts; this does not make it the best container for arbitrary indexed access. Tomorrow, predict the outcome when an outer slot is replaced instead of its child being mutated."
  }
};
