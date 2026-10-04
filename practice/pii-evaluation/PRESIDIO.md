# Detect before scoring

`presidio_adapter.py` connects the existing span scorer to Presidio. It recognizes email addresses, card numbers, US SSNs and a fictional client-ID format. It replaces detections with `[REDACTED]`. It does not detect all personal data.

Use an approved existing environment with `presidio-analyzer`, `presidio-anonymizer`, spaCy and a local English spaCy model directory. Pass that directory to `build`. The loader overrides the download-capable upstream loading method. It loads only the supplied path. Approve the model's provenance and digest first; a local path does not make an artifact trustworthy. Use a network-denied worker for defense in depth. No dependency or model was installed during authoring.

The registry lists its recognizers explicitly. It does not silently load every default recognizer. The English model supports tokenization and context processing; this exercise does not enable general person-name recognition. Unsupported languages fail before analysis. Raise an operational error if assets are absent; never return the unchecked text as though it were redacted.

Simple example: `Client CLI-123456` becomes `Client [REDACTED]` at threshold 0.4. The domain pattern's score is 0.6, so threshold 0.7 omits it. This score is a recognizer confidence signal, not a calibrated probability. The example shows why increasing a threshold can reduce false positives and also increase leaks.

`test_presidio_adapter.py` includes an invalid Luhn checksum, an invalid SSN structure, missing domain-ID digits, unsupported language and a threshold change. Card/SSN strings are synthetic fixtures, not claims of issued identities. Passing a checksum proves neither ownership nor actual issuance. These tests were not executed. The asset-dependent group skips unless `LESSON_SPACY_MODEL` names an approved local directory.

To measure a detector, retain the exact original string and its gold spans. Feed returned `Span` values into `Case` and `score` from `scoring.py`. Offsets refer to the original string, not the redacted string. Record the package versions, model digest, threshold and fixture version beside the result. Use development data to choose thresholds, then freeze a held-out set. The tiny supplied examples cannot establish a leak rate.

Interview: can regex alone detect every account identifier? No. It can recognize an agreed shape, but context may change whether a matching string is sensitive. Add labeled lookalikes and measure task utility. Ask the teacher to review your entity inventory before applying this to a client dataset.

Sources: [local engine load path](https://github.com/microsoft/presidio/blob/main/presidio-analyzer/presidio_analyzer/nlp_engine/spacy_nlp_engine.py), [explicit recognizer registry](https://github.com/microsoft/presidio/blob/main/presidio-analyzer/presidio_analyzer/recognizer_registry/recognizer_registry.py), [card recognizer](https://github.com/microsoft/presidio/blob/main/presidio-analyzer/presidio_analyzer/predefined_recognizers/generic/credit_card_recognizer.py), [SSN recognizer](https://github.com/microsoft/presidio/blob/main/presidio-analyzer/presidio_analyzer/predefined_recognizers/country_specific/us/us_ssn_recognizer.py), [anonymizer](https://presidio.dataprivacystack.org/anonymizer/).
