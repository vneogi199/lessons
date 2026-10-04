# Measure redaction mistakes

This standard-library harness scores supplied detector spans. It does not detect PII or call Presidio. Tests are supplied and unexecuted. When execution is approved, run `python3 -m unittest -v` from this directory in an existing Python environment.

Use synthetic text. An adapter should convert recognizer results to `Span(start, end, entity_type)` against the exact original string. Offsets are Python Unicode character indices, with the end excluded. Do not use UTF-8 byte offsets or change normalization after labeling. Each case needs a unique ID and language. Preserve detector/configuration and dataset versions beside the resulting report.

## Read one result

Text: `abc DEF`. Gold marks `abc` as an email. A faulty detector marks only `ab` and also marks `DE` as a person. The business task needs `DEF`.

- Exact entity match: zero true positives, two false positives and one false negative. Both boundaries and type must match. A partial match does not count as a safe complete redaction.
- Character false-positive rate: two falsely redacted characters / four non-sensitive characters = 0.5. Spaces count under this convention.
- Sensitive-character miss rate: one missed character / three sensitive characters = 1/3.
- Utility loss: two removed useful characters / three labeled useful characters = 2/3.

False discoveries among detected entities use a different denominator: FP/(TP+FP). Do not label that value a character false-positive rate. Entity true negatives are not defined here because the set of possible negative spans is arbitrary. Overlapping spans count once in character metrics, but remain distinct entity predictions. Duplicate identical annotations are rejected.

`None` means that a denominator is zero. An empty slice is not a perfect score. The report includes counts, entity precision/recall/F1, type slices, language slices and their intersections. The type inventory comes from both labels and predictions, so hallucinated entity types remain visible.

Utility spans are task labels: for example, amounts needed to sum invoices. They can overlap sensitive spans. Report that conflict instead of weakening protection silently. Character utility loss is a proxy; also test whether the downstream task still produces its correct result. Do not infer task accuracy from this proxy.

## Review the labels

Freeze document-family holdouts before threshold tuning. Have a second reviewer check ambiguous spans. Record adjudication rather than silently changing gold labels after seeing predictions. Include synthetic email, card and SSN examples, benign number lookalikes, domain IDs and each supported language. Unsupported-language behavior needs its own application test.

Connect an approved analyzer by passing its predictions into this scorer. Sweep detector thresholds on development data, then report the chosen threshold on the held-out data. Include sample counts for rare slices; a tiny slice cannot establish a production leak rate. The supplied fixtures test arithmetic only, not recognition quality.

Interview: why can entity recall be zero while character miss rate is low? A nearly complete but incorrectly bounded entity fails exact matching while covering most characters. Both results are useful; neither proves that a leaked identifier is harmless.

Reference: [precision, recall and F-score definitions](https://scikit-learn.org/stable/modules/generated/sklearn.metrics.precision_recall_fscore_support.html). No scikit-learn installation is needed for this implementation.
