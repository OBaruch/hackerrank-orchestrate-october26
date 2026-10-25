"""Unit and regression tests. Run from the repository root:

    python -m unittest discover -s code/tests -t code -v
"""
import os
import sys

CODE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if CODE not in sys.path:
    sys.path.insert(0, CODE)
