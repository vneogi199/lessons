export const decoratorDepth = `<section class="card mechanism-walkthrough" id="nested-decorators">
<h2>Nested and stacked decorators</h2>
<p>Think of a function as a gift inside two boxes. The outer box opens first, then the inner box, then you reach the gift. When a call returns normally, the inner wrapper finishes before the outer wrapper.</p>
<p>A nested function is a function defined inside another function. A decorator often uses one as its wrapper. Stacking means putting two or more decorators on the same function. A parameterized decorator adds a factory: a function that accepts settings and returns a decorator.</p>
<h3>Follow two wrappers</h3>
<p>Start with two named decorators. Each prints when it is applied, then returns a wrapper for later calls.</p>
<pre data-decorator-example="simple"><code>def deco1(function):
    print("deco1 applied")
    def wrapper():
        print("deco1 before")
        function()
        print("deco1 after")
    return wrapper

def deco2(function):
    print("deco2 applied")
    def wrapper():
        print("deco2 before")
        function()
        print("deco2 after")
    return wrapper

@deco1
@deco2
def func():
    print("original function")

func()</code></pre>
<p>Defining func prints these two lines. The original body does not run yet.</p>
<pre>deco2 applied
deco1 applied</pre>
<p>Calling func() prints:</p>
<pre>deco1 before
deco2 before
original function
deco2 after
deco1 after</pre>
<p>The binding is equivalent to <code>func = deco1(deco2(func))</code> using the original function. Application goes bottom to top. This call enters outer to inner and finishes inner to outer. The output depends on where the wrapper places each print and whether the wrapped call succeeds.</p>
<p>This tiny example only prints: the wrappers discard the wrapped return value and do not preserve metadata. The next version forwards arguments, returns the result, and uses wraps.</p>
<h3>Add a setting to each decorator</h3>
<p>Read the code and the result first. The label distinguishes the wrappers; both use the same factory.</p>
<pre data-decorator-example="stack"><code>from functools import wraps

events = []

def trace(label):
    events.append("configure " + label)
    def decorate(function):
        events.append("decorate " + label)
        @wraps(function)
        def wrapper(*args, **kwargs):
            events.append("enter " + label)
            result = function(*args, **kwargs)
            events.append("leave " + label)
            return result
        return wrapper
    return decorate

@trace("outer")
@trace("inner")
def greet(name):
    events.append("body")
    return "Hello " + name

assert events == ["configure outer", "configure inner",
                  "decorate inner", "decorate outer"]
events.clear()
assert greet(name="Ada") == "Hello Ada"
assert events == ["enter outer", "enter inner", "body",
                  "leave inner", "leave outer"]
assert greet.__name__ == "greet"</code></pre>
<p>When Python executes the definition, it evaluates the decorator expressions from top to bottom. Here that calls trace with outer, then inner. It applies the returned decorators from bottom to top: inner receives the original function, then outer receives the inner wrapper. The body of greet has not run yet.</p>
<p>For already available decorator functions, writing @outer above @inner is equivalent to binding <code>greet = outer(inner(greet))</code> after defining the original function. The resulting outer wrapper is what the name greet refers to.</p>
<p>When you call greet, the sequence is <code>enter outer → enter inner → body → leave inner → leave outer</code>. The returned greeting passes through both wrappers unchanged. On later calls, the wrappers run again; the factory and decoration steps do not.</p>
<h3>Why three nested functions?</h3>
<ol><li><code>trace(label)</code> receives the setting, such as outer.</li><li><code>decorate(function)</code> receives the function to wrap.</li><li><code>wrapper(*args, **kwargs)</code> receives arguments from each later call.</li></ol>
<p>The wrapper retains access to label and function through a closure. A closure lets a nested function use bindings from an enclosing function after that enclosing call has returned. This is why the inner and outer wrappers can remember different labels.</p>
<h3>Changing order can change the value</h3>
<p>Use two simple wrappers: one adds 1 to the result; the other doubles it. Start with 3. Doubling then adding gives 7. Adding then doubling gives 8.</p>
<pre data-decorator-example="order"><code>from functools import wraps

def add_one(function):
    @wraps(function)
    def wrapper():
        return function() + 1
    return wrapper

def double(function):
    @wraps(function)
    def wrapper():
        return function() * 2
    return wrapper

@add_one
@double
def first():
    return 3

@double
@add_one
def second():
    return 3

assert first() == 7
assert second() == 8</code></pre>
<p>These wrappers intentionally accept no arguments because the example functions accept none. Use argument forwarding when you need to preserve a more general calling interface.</p>
<h3>Try it with help</h3>
<p>Change both bodies from 3 to 5. Write each result before running the example. Hint: evaluate the original body first, then work outward through the return expressions.</p>
<details><summary>Check the changed results</summary><p>first returns 11: double 5, then add 1. second returns 12: add 1 to 5, then double it.</p></details>
<p>Next, make greet raise ValueError after recording body. Which trace entries remain? Hint: the leave entries are after the call, not in a finally block.</p>
<details><summary>Check the exception path</summary><p>The trace contains enter outer, enter inner, body. Neither leave entry runs, and ValueError reaches the caller. Use try/finally if the after-call work must run on both success and failure. Do not return from finally: that can suppress an exception or replace a result.</p></details>
<h3>Interview follow-ups</h3>
<details><summary>Does wraps make every wrapper behave like the original?</summary><p>No. It preserves selected metadata and provides __wrapped__. It does not fix argument forwarding, return values, exceptions, or async behavior. The wrapper still has to implement those correctly.</p></details>
<details><summary>How does timing interact with retries?</summary><p>A timer outside the retry wrapper can measure the whole operation, including retries and waits. A timer inside can measure each individual attempt. Choose based on the metric you need. Retrying side effects also requires a safety or idempotency policy; changing decorator order does not provide one.</p></details>
<details><summary>Why can putting a cache outside authorization be unsafe?</summary><p>A cache hit can return before the inner authorization check runs. Check access on every request and scope cache keys to the data's permission boundary. Even authorization outside the cache does not make an incorrectly shared key safe.</p></details>
<details><summary>Can the synchronous trace wrapper time an async function?</summary><p>It would trace the creation of its coroutine, not the execution of the awaited work. For that purpose use an async wrapper that awaits the wrapped call, with appropriate exception and cleanup handling.</p></details>
<p>Tomorrow, draw both phases from memory: decoration when the definition executes, then wrapper execution when the function is called. If either is unclear, ask your teacher to trace one call with you.</p>
<p>Sources: <a href="https://docs.python.org/3/reference/compound_stmts.html#function-definitions">Python function definitions and decorators</a> · <a href="https://docs.python.org/3/library/functools.html#functools.wraps">functools.wraps</a>.</p>
</section>`;
