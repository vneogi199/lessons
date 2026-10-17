"""Small data-validation contract for the tooling lesson."""


def parse_quantity(raw):
    if type(raw) is int:
        quantity = raw
    elif isinstance(raw, str):
        text = raw.strip()
        if not text or not text.isascii() or not text.isdecimal():
            raise ValueError("quantity must be a positive integer")
        quantity = int(text)
    else:
        raise ValueError("quantity must be a positive integer")
    if quantity <= 0:
        raise ValueError("quantity must be a positive integer")
    return quantity
