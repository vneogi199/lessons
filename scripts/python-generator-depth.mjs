export const generatorDepth = String.raw`<section class="card mechanism-walkthrough" id="generator-basics">
<h2>Generators, one value at a time</h2>
<p>Think of a generator as a bookmark in a recipe. It does some work, hands you a result, and keeps its place. Asking for another result resumes the same recipe. A function containing yield creates a generator when called; its body starts when iteration begins.</p>
<h3>Follow each next() call</h3>
<pre data-generator-example="steps"><code>def numbers():
    yield 1
    yield 2
    yield 3

gen = numbers()
assert iter(gen) is gen
assert next(gen) == 1
assert next(gen) == 2
assert next(gen) == 3
try:
    next(gen)
except StopIteration:
    pass
else:
    raise AssertionError("The generator should be exhausted")
assert list(gen) == []
assert list(numbers()) == [1, 2, 3]</code></pre>
<ol><li><code>numbers()</code> creates the generator. No body statements have run.</li><li>The first <code>next(gen)</code> reaches yield 1. It produces 1 and suspends there.</li><li>The second call resumes after that yield, reaches yield 2, and produces 2.</li><li>The third reaches yield 3 and produces 3.</li><li>The fourth reaches the end and raises StopIteration. Later calls stay exhausted.</li></ol>
<p>A for loop requests values and handles normal exhaustion for you. For example, <code>for value in numbers(): print(value)</code> prints 1, 2, and 3 on separate lines. Create a new generator to start again.</p>
<h3>Generator expressions consume their results</h3>
<pre data-generator-example="expression"><code>squares = (x * x for x in range(5))
assert next(squares) == 0
assert next(squares) == 1
assert list(squares) == [4, 9, 16]
assert list(squares) == []

saved = [x * x for x in range(5)]
assert saved[2] == 4
assert list(saved) == list(saved)</code></pre>
<p>The parentheses create a generator expression. It computes results as they are requested. The square brackets build a list immediately. A list stores results, supports indexing, and can be iterated again. A generator has no indexing and does not restart. list(generator) stores only the remaining results; it also consumes them.</p>
<p>Laziness can avoid large intermediate lists. It does not guarantee low memory use: a suspended generator retains needed local state and may hold references to large objects. Its input may already be a large list. In a generator expression, the leftmost iterable expression is evaluated when the expression is created.</p>
<h3>yield pauses; return ends</h3>
<pre data-generator-example="return"><code>def example():
    print("Start")
    yield 10
    print("Middle")
    yield 20
    print("End")
    return "finished"

gen = example()
assert next(gen) == 10
assert next(gen) == 20
try:
    next(gen)
except StopIteration as end:
    assert end.value == "finished"
else:
    raise AssertionError("Expected completion")</code></pre>
<p>The first next prints Start and produces 10. The second prints Middle and produces 20. The third prints End and terminates. The returned string is a completion value, not another yielded item. A for loop does not expose that completion value.</p>
<h3>Read matching lines without collecting them</h3>
<pre data-generator-example="file"><code>from contextlib import closing
from pathlib import Path
from tempfile import TemporaryDirectory

def read_errors(file_path):
    with open(file_path, encoding="utf-8") as file:
        for line in file:
            if "ERROR" in line:
                yield line.strip()

with TemporaryDirectory() as directory:
    path = Path(directory) / "app.log"
    path.write_text("INFO ready\nERROR first\nERROR second\n",
                    encoding="utf-8")
    with closing(read_errors(path)) as errors:
        assert next(errors) == "ERROR first"
        # Stop early; closing still closes the generator.
    assert list(errors) == []</code></pre>
<p>Only requested matches are produced. Reading one match may still scan many non-matching lines. The file stays open while execution is suspended inside the with block. The outer closing block calls close even when you stop early; closing unwinds the generator and exits its file context. A plain break does not itself close a retained generator. Exceptions such as a missing file appear during iteration because that is when open runs.</p>
<h3>Delegate with yield from</h3>
<pre data-generator-example="delegation"><code>def first():
    yield 1
    yield 2
    return "inner complete"

def second():
    result = yield from first()
    assert result == "inner complete"
    yield 3

assert list(second()) == [1, 2, 3]</code></pre>
<p>For simple values, yield from looks like a loop that yields each item. It also delegates generator communication, including send, throw, and close where supported. The delegated generator's return value becomes the result of the yield from expression.</p>
<h3>Send a value back in</h3>
<pre data-generator-example="send"><code>def conversation():
    name = yield "Name?"
    yield "Hello " + name

gen = conversation()
assert next(gen) == "Name?"
assert gen.send("Ada") == "Hello Ada"
gen.close()</code></pre>
<p>The first next primes the generator by reaching a yield. send("Ada") makes that paused yield expression evaluate to Ada, assigns name, and resumes execution until the next yield. Sending a non-None value before priming raises TypeError. send(None) can start the generator and otherwise advances it like next.</p>
<h3>Try it, then check</h3>
<p>Make a fresh squares generator for range(5), consume three values, then collect the rest. Write the list before running it.</p>
<details><summary>Answer</summary><p>The consumed results are 0, 1, and 4. The remaining list is [9, 16].</p></details>
<details><summary>Interview: Is every iterator a generator?</summary><p>No. A generator implements the iterator protocol, but an iterator can instead be a class with __iter__ and __next__. For a generator, iter(gen) returns that same generator.</p></details>
<details><summary>Interview: Does yield make a task run in the background?</summary><p>No. A synchronous generator runs when its caller advances it. It does not create a thread or provide background parallelism.</p></details>
<details><summary>Interview: Why not raise StopIteration yourself inside the generator?</summary><p>Use return or reach the end for normal completion. An unhandled StopIteration raised inside a generator is converted to RuntimeError. That helps expose accidentally exhausted internal iterators.</p></details>
<details><summary>Interview: What happens to errors and cleanup?</summary><p>Errors propagate when the generator is advanced. close injects GeneratorExit into a suspended generator so finally blocks and active context managers can clean up. Do not yield a value in response to GeneratorExit. Avoid relying on garbage collection for timely resource cleanup.</p></details>
<p>Tomorrow, explain creation, first iteration, suspension, and exhaustion without notes. Ask your teacher about the exact step that is unclear.</p>
<p>Sources: <a href="https://docs.python.org/3/reference/expressions.html#yield-expressions">Python yield expressions</a> and <a href="https://docs.python.org/3/library/contextlib.html#contextlib.closing">explicit closing</a>.</p>
</section>`;
