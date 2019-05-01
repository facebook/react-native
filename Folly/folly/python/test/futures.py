#!/usr/bin/env python3
import asyncio
import unittest

from . import simplebridge


class Futures(unittest.TestCase):
    def test_bridge(self):
        val = 1337
        loop = asyncio.get_event_loop()
        res = loop.run_until_complete(simplebridge.get_value_x5(val))
        self.assertEqual(val * 5, res)

    def test_bridge_exception(self):
        loop = asyncio.get_event_loop()
        with self.assertRaises(ValueError, msg="0 is not allowed"):
            loop.run_until_complete(simplebridge.get_value_x5(0))

    def test_bridge_fibers(self):
        val = 1337
        loop = asyncio.get_event_loop()
        res = loop.run_until_complete(simplebridge.get_value_x5_fibers(val))
        self.assertEqual(val * 5, res)
