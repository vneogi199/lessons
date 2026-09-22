import numpy as np
import pandas as pd
import pytest
from analytics import desk_report, scenario_pnl


def test_broadcasting():
    result = scenario_pnl([-100, 50], [-10, 0, 10])
    assert result.shape == (2, 3)
    np.testing.assert_allclose(result, [[1000, 0, -1000], [-500, 0, 500]])
    np.testing.assert_allclose(result.sum(axis=0), [500, 0, -500])
    with pytest.raises(ValueError):
        scenario_pnl([np.nan], [1])


def test_dataframe_group_and_join():
    rfqs = pd.DataFrame({"id": ["a", "b"], "desk": ["R", "R"], "currency": ["USD", "USD"],
                         "notional": [100, 200], "status": ["parsed", "parsed"]})
    limits = pd.DataFrame({"desk": ["R"], "currency": ["USD"], "notional_limit": [500]})
    result = desk_report(rfqs, limits)
    assert result.iloc[0]["requested_notional"] == 300 and result.iloc[0]["_merge"] == "both"
    with pytest.raises(pd.errors.MergeError):
        desk_report(rfqs, pd.concat([limits, limits]))
