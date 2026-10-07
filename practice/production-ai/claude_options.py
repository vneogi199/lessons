"""Configuration only; importing/calling this never starts a provider query."""


def extraction_options(model):
    from claude_agent_sdk import ClaudeAgentOptions
    if not isinstance(model, str) or not model.strip():
        raise ValueError("explicit reviewed model identifier required")
    return ClaudeAgentOptions(
        model=model,
        tools=[],
        disallowed_tools=["*"],
        permission_mode="dontAsk",
        setting_sources=[],
        strict_mcp_config=True,
        mcp_servers={},
        max_turns=2,
        max_budget_usd=0.10,
        output_format={"type": "json_schema", "schema": {
            "type": "object", "additionalProperties": False,
            "required": ["instrument", "quantity"],
            "properties": {"instrument": {"type": "string"},
                           "quantity": {"type": "integer", "minimum": 1}},
        }},
    )
