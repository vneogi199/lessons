"""Explicit English recognizers with a pre-provisioned, local-only spaCy engine."""
from pathlib import Path
import math
from scoring import Span


ENTITIES = {"EMAIL_ADDRESS", "CREDIT_CARD", "US_SSN", "CLIENT_ID"}


def build(model_directory):
    import spacy
    from presidio_analyzer import AnalyzerEngine, Pattern, PatternRecognizer, RecognizerRegistry
    from presidio_analyzer.nlp_engine import SpacyNlpEngine
    from presidio_analyzer.predefined_recognizers import EmailRecognizer, CreditCardRecognizer, UsSsnRecognizer
    from presidio_anonymizer import AnonymizerEngine

    path = Path(model_directory).resolve(strict=True)
    if not path.is_dir() or not (path / "config.cfg").is_file():
        raise ValueError("approved local spaCy model directory required")

    class LocalOnlyEngine(SpacyNlpEngine):
        def load(self):
            # Override the upstream load path, which can download a missing model.
            self.nlp = {"en": spacy.load(path)}

    engine = LocalOnlyEngine(models=[{"lang_code": "en", "model_name": str(path)}])
    engine.load()
    registry = RecognizerRegistry(supported_languages=["en"], recognizers=[
        EmailRecognizer(), CreditCardRecognizer(), UsSsnRecognizer(),
        PatternRecognizer(supported_entity="CLIENT_ID", supported_language="en",
            patterns=[Pattern("synthetic client ID", r"\bCLI-[0-9]{6}\b", .6)],
            global_regex_flags=0),
    ])
    analyzer = AnalyzerEngine(registry=registry, nlp_engine=engine, supported_languages=["en"])
    return Detector(analyzer, AnonymizerEngine())


class Detector:
    def __init__(self, analyzer, anonymizer):
        self.analyzer, self.anonymizer = analyzer, anonymizer

    def redact(self, text, *, language="en", threshold=.4):
        if language != "en" or not isinstance(text, str) or not 1 <= len(text) <= 8000:
            raise ValueError("English text between 1 and 8000 characters required")
        if type(threshold) not in {float, int} or not math.isfinite(threshold) or not 0 <= threshold <= 1:
            raise ValueError("threshold must be between zero and one")
        results = self.analyzer.analyze(text=text, language=language,
            entities=sorted(ENTITIES), score_threshold=threshold)
        if len(results) > 1000 or any(r.entity_type not in ENTITIES or
                not 0 <= r.start < r.end <= len(text) for r in results):
            raise ValueError("invalid detector spans")
        from presidio_anonymizer.entities import OperatorConfig
        result = self.anonymizer.anonymize(text=text, analyzer_results=results,
            operators={"DEFAULT": OperatorConfig("replace", {"new_value": "[REDACTED]"})})
        # Keep original offsets for evaluation; replacement changes output offsets.
        return result.text, tuple(Span(r.start, r.end, r.entity_type) for r in results)
