"""Pandas/NumPy interview transformations; existing dependencies required."""
import numpy as np
import pandas as pd


def desk_report(rfqs, limits):
    """Inputs have notional in integer units; reports preserve desk/currency keys."""
    if rfqs[["desk", "currency", "notional"]].isna().any().any():
        raise ValueError("null RFQ keys or notional")
    if not pd.api.types.is_integer_dtype(rfqs["notional"]) or (rfqs["notional"] <= 0).any():
        raise ValueError("positive integer notional required")
    if limits[["desk", "currency", "notional_limit"]].isna().any().any():
        raise ValueError("null limit fields")
    if not pd.api.types.is_integer_dtype(limits["notional_limit"]) or (limits["notional_limit"] < 0).any():
        raise ValueError("nonnegative integer limits required")
    totals = (rfqs.loc[rfqs["status"].eq("parsed")]
              .groupby(["desk", "currency"], as_index=False)
              .agg(requests=("id", "size"), requested_notional=("notional", "sum")))
    return (totals.merge(limits, on=["desk", "currency"], how="left", validate="many_to_one", indicator=True)
            .sort_values(["requested_notional", "desk", "currency"], ascending=[False, True, True]))


def scenario_pnl(signed_pnl_per_bp, shocks_bps):
    """Rows=positions, columns=scenarios. Sign is supplied, not inferred from DV01."""
    sensitivities = np.asarray(signed_pnl_per_bp, dtype=np.float64)
    shocks = np.asarray(shocks_bps, dtype=np.float64)
    if sensitivities.ndim != 1 or shocks.ndim != 1 or not sensitivities.size or not shocks.size:
        raise ValueError("nonempty 1-D vectors required")
    if not np.isfinite(sensitivities).all() or not np.isfinite(shocks).all():
        raise ValueError("finite inputs required")
    # First-order local approximation, not swap valuation or nonlinear stress pricing.
    with np.errstate(over="raise", invalid="raise"):
        result = sensitivities[:, None] * shocks[None, :]
    return result
