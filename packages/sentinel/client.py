#!/usr/bin/env python3
"""
ESTA Sentinel - Ollama Client

Local LLM client for Michigan ESTA law change predictions.
Provides 60-90 day advance alerts for upcoming compliance changes.

Usage:
    python client.py  # Interactive mode
    python client.py "Your question about ESTA changes"

Prerequisites:
    pip install ollama
    ollama create esta-sentinel -f Modelfile  # First time setup
"""

import sys
from typing import Optional

# Ollama client import - requires: pip install ollama
try:
    import ollama
except ImportError:
    print("Error: ollama package not installed.")
    print("Install with: pip install ollama")
    print("Also ensure Ollama is running: https://ollama.ai")
    sys.exit(1)


def query_sentinel(prompt: str, model: str = "llama3.2") -> Optional[str]:
    """
    Query the ESTA Sentinel model for law change predictions.

    Args:
        prompt: The question or topic to analyze
        model: The Ollama model to use (default: llama3.2)

    Returns:
        The model's response text or None on error
    """
    try:
        response = ollama.generate(model=model, prompt=prompt)
        return response.get("response", "")
    except ollama.ResponseError as e:
        print(f"Ollama API error: {e}")
        return None
    except Exception as e:
        print(f"Error querying Sentinel: {e}")
        return None


def main():
    """Main entry point for the Sentinel client."""
    # Default prompt for expo demo
    default_prompt = "Upcoming ESTA changes 2026?"

    # Use command line argument or default
    if len(sys.argv) > 1:
        prompt = " ".join(sys.argv[1:])
    else:
        prompt = default_prompt

    print(f"ESTA Sentinel - Querying: {prompt}")
    print("-" * 50)

    response = query_sentinel(prompt)

    if response:
        print(response)
        # Example output: "Accrual 1:30 from July 1"
    else:
        print("No response received. Ensure Ollama is running.")
        print("Start with: ollama serve")
        print("Create model: ollama create esta-sentinel -f Modelfile")


if __name__ == "__main__":
    main()
