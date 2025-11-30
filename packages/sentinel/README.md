# ESTA Sentinel

Local LLM-powered predictive alerts for Michigan ESTA law changes.

## Overview

ESTA Sentinel uses Ollama with LLama 3.2 to analyze RSS feeds and legal bulletins, providing 60-90 day advance alerts for upcoming ESTA compliance changes.

## Features

- **Predictive Alerts**: Get advance warning of regulatory changes
- **Law Analysis**: Summarize complex legal changes in plain language
- **Local AI**: All processing happens locally - no data leaves your machine
- **ESTA Expertise**: Custom-tuned system prompt for Michigan ESTA compliance

## Prerequisites

1. Install [Ollama](https://ollama.ai)
2. Install Python dependencies: `pip install ollama`

## Quick Start

```bash
# Start Ollama server
ollama serve

# Create the ESTA Sentinel model (first time only)
ollama create esta-sentinel -f Modelfile

# Run the client
python client.py
# Or with a custom prompt:
python client.py "What accrual rate changes are expected in 2026?"
```

## Example Output

```
ESTA Sentinel - Querying: Upcoming ESTA changes 2026?
--------------------------------------------------
Based on current legislative tracking, the following changes are anticipated:

**Summary**: Michigan ESTA accrual rate modifications
**Effective Date**: July 1, 2026 (proposed)
**Impact on Employers**:
- Large employers: Accrual 1:30 ratio confirmed
- Small employers: 40-hour annual grant maintained

**Recommended Actions**:
1. Review current accrual tracking systems
2. Update employee handbooks
3. Notify payroll providers
```

## Integration

The Sentinel integrates with the ESTA Tracker ecosystem:

- Feeds into the dashboard for compliance alerts
- Syncs with n8n workflows for automated monitoring
- Connects to Helix Core for accrual validation

## Files

- `Modelfile` - Ollama model configuration with ESTA expertise
- `client.py` - Python client for querying the model
- `package.json` - NPM package definition

## Expo Demo

This is a killer feature for expo presentations:

> "AI thinks for you - 60-90 day advance alerts for compliance changes"
