export const neuralFoundations = `<section class="card mechanism-walkthrough" id="neural-network-basics">
<h2>From one neuron to a feed-forward network</h2>
<p>A vector is an ordered list of numbers. Here x = [2, 3] has two features, or input measurements. A neuron combines them using adjustable numbers called weights, adds a bias, then applies an activation function. Think of weights as knobs that change how strongly each input affects the result. The bias shifts the starting point.</p>
<p>For weights [0.5, −1] and bias 2, the weighted sum is z = 2 × 0.5 + 3 × (−1) + 2 = 0. ReLU is an activation that returns max(0, z). The neuron therefore returns 0. The weights and bias in this example are chosen by hand, not learned from data.</p>
<pre data-neural-example="neuron"><code>def relu(value):
    return max(0, value)

def neuron(x, weights, bias):
    if len(x) != len(weights):
        raise ValueError("one weight is needed per input")
    return relu(sum(a * b for a, b in zip(x, weights)) + bias)

assert neuron([2, 3], [0.5, -1], 2) == 0
assert neuron([2, 3], [0.5, -1], 3) == 1</code></pre>
<p>Changing only the bias from 2 to 3 raises z to 1. A negative weight can reduce a neuron's input; it is not automatically a bug. A weight's magnitude alone is not a reliable feature-importance score because feature scales and other layers matter.</p>
<h3>Several neurons make a layer</h3>
<p>Use two hidden neurons. Each reads both inputs but has its own weights and bias. Their outputs become the inputs to one output neuron. Hidden means an intermediate computation, not a secret value.</p>
<pre>Input [2, 3]
  hidden A: ReLU(1×2 + 1×3 + 0)   = 5
  hidden B: ReLU(1×2 − 1×3 + 0)   = 0
Hidden vector [5, 0]
  output: 2×5 − 1×0 + 1           = 11</pre>
<p>This is a 2 → 2 → 1 network: two inputs, two hidden units, one output. Data travels forward through these layers without a recurrent loop, so it is a feed-forward neural network, or FFNN. A dense network like this is also called a multilayer perceptron, or MLP. Our output is an unrestricted numerical prediction, not a probability.</p>
<pre data-neural-example="network"><code>def predict(x):
    if len(x) != 2:
        raise ValueError("expected two features")
    hidden_a = max(0, x[0] + x[1])
    hidden_b = max(0, x[0] - x[1])
    return 2 * hidden_a - hidden_b + 1

assert predict([2, 3]) == 11
assert predict([3, 2]) == 10
assert predict([0, 0]) == 1</code></pre>
<p>Matrix form collects the neurons together: h = ReLU(W1 x + b1), then y = W2 h + b2. Using column vectors here, W1 has shape 2 × 2, b1 has two entries, W2 has shape 1 × 2, and b2 has one entry. Other code may use row vectors and transpose the weights; state the convention before checking shapes.</p>
<h3>Why use an activation?</h3>
<p>Without the nonlinear ReLU between layers, W2(W1 x + b1) + b2 collapses to one affine transformation: (W2 W1)x + (W2 b1 + b2). Stacking those layers would not give a richer nonlinear function. ReLU changes which regions are active. It is not always the best activation: negative inputs have zero gradient through ReLU, and a unit can remain inactive. Other networks may use GELU or gated activations.</p>
<p>The final activation depends on the task. An unrestricted regression output may have no activation. A binary classifier may use a sigmoid probability, or supply raw logits to a loss that includes the sigmoid calculation. Do not add an activation blindly or apply it twice.</p>
<h3>Parameters versus hyperparameters</h3>
<p>Model parameters are stored values such as weights and biases. Training adjusts the trainable parameters. A frozen weight is still a model parameter, but that training run does not update it. Hyperparameters control the setup, such as learning rate, hidden width, layer count, and batch size. They can be tuned with validation experiments; they are not the weights learned by the ordinary gradient update.</p>
<p>Inputs and hidden activations are data-dependent values, not new learned parameters. A gradient measures how a loss changes with a parameter. It is used to update a parameter; it is not an extra model parameter.</p>
<h3>Count the numbers, not the neurons</h3>
<p>A dense layer with m inputs and n outputs has m × n weights. With one bias per output, its count is m × n + n. The input features themselves add no parameters.</p>
<pre>Our 2 → 2 → 1 network:
First layer:   2×2 weights + 2 biases = 6
Output layer:  2×1 weights + 1 bias   = 3
Total:                                  9

A 3 → 4 → 2 network:
First layer:   3×4 + 4 = 16
Output layer:  4×2 + 2 = 10
Total:                   26</pre>
<pre data-neural-example="count"><code>def dense_parameters(inputs, outputs, bias=True):
    if any(type(n) is not int or n &lt; 1 for n in (inputs, outputs)):
        raise ValueError("layer widths must be positive integers")
    return inputs * outputs + (outputs if bias else 0)

assert dense_parameters(2, 2) + dense_parameters(2, 1) == 9
assert dense_parameters(3, 4) + dense_parameters(4, 2) == 26
assert dense_parameters(3, 4, False) == 12</code></pre>
<p>ReLU has no learned parameters. Processing 100 examples with the same network still uses the same 9 parameters; it creates more activations and more computation. If layers share the same parameter storage, count that storage once. Exclude frozen parameters only when reporting the trainable count, not the total count.</p>
<h3>How one parameter learns</h3>
<p>Use the smaller model prediction = w × x with x = 2, target = 6, and w = 1. The prediction is 2. Squared-error loss is (2 − 6)² = 16. Its derivative with respect to w is 2 × (prediction − target) × x = −16. A learning rate of 0.1 gives new w = 1 − 0.1 × (−16) = 2.6. The new prediction is 5.2 and the loss is 0.64.</p>
<pre data-neural-example="update"><code>from math import isclose
x, target, weight, rate = 2.0, 6.0, 1.0, 0.1
prediction = weight * x
loss_before = (prediction - target) ** 2
gradient = 2 * (prediction - target) * x
weight -= rate * gradient
loss_after = (weight * x - target) ** 2
assert isclose(weight, 2.6)
assert isclose(loss_before, 16.0)
assert isclose(loss_after, 0.64)</code></pre>
<p>A larger network uses backpropagation: the chain rule carries loss derivatives backward through the computation. An optimizer then updates parameters. Feed-forward describes the prediction path; it does not prohibit backward gradient calculation during training. This one-step example demonstrates arithmetic only. Lower training loss does not establish accuracy on unseen data.</p>
<h3>Practise after the worked examples</h3>
<p>For the small network, calculate the output for [3, 2]. Then count parameters in a dense 2 → 3 → 1 network with biases.</p>
<details><summary>Check the answers</summary><p>The hidden values are [5, 1], so the output is 10. The new network has (2×3 + 3) + (3×1 + 1) = 13 parameters.</p></details>
<details><summary>Interview: Does a 7-billion-parameter model contain seven billion neurons?</summary><p>No. It refers to stored scalar parameters, not neurons. At two bytes per parameter, the raw parameter payload is 14 billion bytes, or about 14 decimal GB. Runtime memory also needs activations, temporary buffers, and possibly a KV cache; training adds gradients and optimizer state. This payload estimate is not a device-memory requirement.</p></details>
<details><summary>Interview: Is a larger model always better?</summary><p>No. Data quality, training, architecture, evaluation fit, and serving constraints matter. More parameters can increase capacity and resource cost without improving your task. Compare measured quality, cost, and latency.</p></details>
<details><summary>Interview: Does inference learn new weights from my prompt?</summary><p>Ordinary inference uses fixed weights. The prompt changes activations and outputs, not model parameters. Fine-tuning is a separate update process; application memory and conversation history are not themselves weight training.</p></details>
<p>Continue to <a href="0582-attention-transformer-blocks-residual-streams-normalization-and-feed-for.html#transformer-ffn-parameters">the transformer FFN example</a>. Use the <a href="../reference/neural-network-quick-reference.html">calculation card</a> for revision. Tomorrow, explain the nine-parameter network from memory. Ask your teacher to trace any multiplication that is unclear.</p>
<p>Sources: <a href="https://docs.pytorch.org/docs/stable/generated/torch.nn.Linear.html">dense-layer weights and biases</a> · <a href="https://docs.pytorch.org/docs/stable/generated/torch.nn.ReLU.html">ReLU</a>.</p>
</section>`;

export const transformerFfn = `<section class="card mechanism-walkthrough" id="transformer-ffn-parameters">
<h2>Where the feed-forward network fits</h2>
<p>Start with <a href="0578-optimization-gradients-loss-functions-regularization-and-generalization.html#neural-network-basics">lesson 0578's neuron-to-network walkthrough</a> if weights and biases are unfamiliar. A token vector is an ordered list of features. An attention layer lets one position combine information from other permitted positions. The position-wise FFN then transforms each position's feature vector using the same learned weights across positions within that layer.</p>
<pre>Token vectors → attention mixes permitted positions
             → FFN transforms features at each position
             → next block

One FFN: model width 2 → hidden width 3 → model width 2
Three token positions: 3×2 → 3×3 → 3×2</pre>
<p>This is the FFN portion only; a full block also has residual connections and normalization. Attention has already made the input vectors context-dependent. “Position-wise” does not mean the whole transformer ignores context.</p>
<p>For a basic two-layer FFN, FFN(x) = W2 activation(W1 x + b1) + b2. At model width d and hidden width f, the two weight matrices contain d×f + f×d = 2df parameters. Biases add f + d when present. With d = 2 and f = 3, that is 12 weights + 5 biases = 17 parameters. Using it on three tokens still needs 17 parameters, not 51.</p>
<pre data-neural-example="transformer-count"><code>model_width, hidden_width = 2, 3
weights = 2 * model_width * hidden_width
biases = hidden_width + model_width
assert weights + biases == 17
assert 2 * 4 * 8 + 8 + 4 == 76</code></pre>
<p>Do not apply this count to every architecture. Gated FFNs may use three weight matrices, and biases may be omitted. Different transformer layers usually have separate parameters unless explicitly tied. Residual additions introduce no parameters by themselves; normalization may contain learned values.</p>
<p>The matrices that project inputs into queries, keys, and values are learned parameters. The attention scores, softmax attention weights, and resulting token activations are computed for the current input. Despite the word weights, attention weights are not a separately stored learned matrix for every possible input. Embedding tables also contain parameters; a full model count includes more than its FFNs.</p>
<details><summary>Practice: model width 4, FFN hidden width 8, both biases present. Count parameters.</summary><p>There are 4×8 + 8×4 = 64 weights and 8 + 4 = 12 biases, for 76 total. Sequence length does not multiply this count, though it affects work and activation memory.</p></details>
<details><summary>Interview: Does the KV cache increase model parameters?</summary><p>No. It stores input-dependent key and value tensors for reuse during decoding. Longer context can increase cache memory without changing the model's parameter count.</p></details>
<details><summary>Interview: Why expand the hidden width and project back?</summary><p>The hidden transformation gives the FFN more intermediate features and nonlinear capacity. Projecting back restores the model width for the residual addition. A wider hidden layer also increases parameters and computation; it is a design choice, not free improvement.</p></details>
<p>Source: <a href="https://arxiv.org/html/1706.03762v7">Attention Is All You Need, position-wise feed-forward networks</a>. The two-layer form is one architecture; modern gated variants need their own count.</p>
</section>`;
