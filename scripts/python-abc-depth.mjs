export const abcDepth = `<section class="card mechanism-walkthrough" id="abc-registration">
<h2>ABC registration versus inheritance</h2>
<p>Think of registration as adding a name to a membership list. It changes who is recognized as a member. It does not give that member new abilities. An abstract base class, or ABC, can recognize an unrelated class through register(). That class is called a virtual subclass.</p>
<p>Read the checks below before trying the exercise. Each example is independent and uses fresh classes.</p>
<h3>Register only Duck</h3>
<pre data-abc-example="registration"><code>from abc import ABC

class Quackable(ABC):
    pass

class Duck:
    pass

class Dog:
    pass

Quackable.register(Duck)
duck = Duck()
dog = Dog()

assert issubclass(Duck, Quackable)
assert not issubclass(Dog, Quackable)
assert isinstance(duck, Quackable)
assert not isinstance(dog, Quackable)
assert type(duck) is Duck
assert type(duck) is not Quackable
assert type(dog) is not Quackable
assert type(duck) is not object
assert isinstance(duck, object) and isinstance(dog, object)
assert issubclass(Duck, object) and issubclass(Dog, object)
assert Quackable not in Duck.__mro__

class Duckling(Duck):
    pass

assert issubclass(Duckling, Quackable)
assert isinstance(Duckling(), Quackable)</code></pre>
<p>Duck is registered; Dog is not. Duckling is recognized too because it inherits from Duck. type(duck) still returns Duck. Use type(obj) is SomeClass for an exact type comparison and isinstance(obj, SomeClass) when subclass recognition is intended. Python has no built-in isobject() function.</p>
<p>The MRO is the ordered list of classes used to find inherited methods. Registration leaves that list unchanged. These examples use the default ABC checks; a custom __subclasshook__ can change recognition rules.</p>
<h3>Which class receives the method?</h3>
<pre data-abc-example="inheritance"><code>from abc import ABC

class Quackable(ABC):
    def quack(self):
        return "Quack!"

class Duck(Quackable):
    pass

class Penguin:
    pass

Quackable.register(Penguin)
assert Duck().quack() == "Quack!"
assert isinstance(Penguin(), Quackable)
assert type(Duck()) is Duck
assert Quackable in Duck.__mro__
assert Quackable not in Penguin.__mro__
try:
    Penguin().quack()
except AttributeError:
    pass
else:
    raise AssertionError("Registration must not supply quack")</code></pre>
<p>Duck finds quack through inheritance. Penguin passes the ABC check but has no quack method. Registration does not put Quackable in the lookup path used by super(), either. super() follows the MRO; it does not search a registry.</p>
<h3>Abstract methods do not validate a registered class</h3>
<pre data-abc-example="abstract"><code>from abc import ABC, abstractmethod

class Quackable(ABC):
    @abstractmethod
    def quack(self):
        pass

class Duck(Quackable):
    pass

class Penguin:
    pass

Quackable.register(Penguin)
try:
    Duck()
except TypeError:
    pass
else:
    raise AssertionError("Duck still has an abstract method")

penguin = Penguin()
assert isinstance(penguin, Quackable)
assert not hasattr(penguin, "quack")

class ReadyDuck(Quackable):
    def quack(self):
        return "Quack!"

assert ReadyDuck().quack() == "Quack!"</code></pre>
<p>Duck cannot be instantiated while its abstract method remains unimplemented. Penguin can: registration does not enforce that requirement. ReadyDuck supplies a concrete implementation. Abstract-method enforcement still does not prove a compatible signature or correct behaviour; tests remain necessary.</p>
<h3>Try a small change</h3>
<p>In the first example, register Dog instead of Duck. Predict the four Quackable checks before changing the assertions. Hint: Duckling inherits from Duck, not Dog.</p>
<details><summary>Check your prediction</summary><p>Duck and its instance fail the Quackable checks. Dog and its instance pass. Duckling also fails. Exact types and MROs stay unchanged.</p></details>
<h3>Interview checkpoints</h3>
<details><summary>Can isinstance(x, Quackable) be true while x.quack() fails?</summary><p>Yes. A virtual subclass may be registered without implementing quack. Recognition is not a runtime contract test.</p></details>
<details><summary>Does actual inheritance make type(Duck()) is Quackable true?</summary><p>No. Its exact type remains Duck. Use isinstance for inheritance-aware recognition.</p></details>
<details><summary>When would you use register instead of inheritance?</summary><p>When an existing compatible class should participate in ABC-based checks without changing its base classes. Verify its behaviour first. Use inheritance when you need inherited implementations or the ABC's abstract-method instantiation checks. Neither option proves behavioural substitutability.</p></details>
<details><summary>Does defining quack alone make an unrelated class a Quackable?</summary><p>Not for the plain ABC used here. It needs inheritance, registration, or a recognition rule such as a custom subclass hook. Merely calling a quack method is duck typing and does not require that ABC check.</p></details>
<p>Tomorrow, explain why Penguin can pass isinstance yet lack quack. If that still feels surprising, ask your teacher to trace recognition separately from method lookup.</p>
<p>Source: <a href="https://docs.python.org/3/library/abc.html">Python ABC documentation: registration, MRO, and abstract methods</a>.</p>
</section>`;
