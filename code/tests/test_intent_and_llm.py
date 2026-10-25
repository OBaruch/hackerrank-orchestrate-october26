"""Keyword intent fallback, the LLM wrapper's cache and the classifier's fallback behaviour."""
import json
import os
import tempfile
import unittest

from ghost_audit import intent
from ghost_audit.llm import LLM


class KeywordIntentTest(unittest.TestCase):
    def test_deletion_in_several_languages(self):
        for text in ("Please delete my account and every copy of my data.",
                     "Quiero eliminar mi cuenta y mis datos personales.",
                     "Bitte löschen Sie mein Konto.",
                     "Merci de supprimer mon compte.",
                     "계정을 삭제해 주세요.",
                     "アカウントを削除してください。"):
            with self.subTest(text=text):
                self.assertTrue(intent.keyword_intent(text)["authorizes_deletion"])

    def test_requests_that_do_not_authorize_deletion(self):
        for text in ("Please send me a copy of my data. Do not delete my account.",
                     "No quiero borrar mi cuenta, solo necesito una copia de mis datos.",
                     "Quero apenas sair da lista de marketing.",
                     "Ne supprimez pas mon compte, corrigez seulement mon adresse.",
                     "Please update the phone number on my profile."):
            with self.subTest(text=text):
                self.assertFalse(intent.keyword_intent(text)["authorizes_deletion"])


class FakeLLM:
    def __init__(self, answer):
        self.answer = answer

    def json_call(self, *args, **kwargs):
        return self.answer


class ClassifierTest(unittest.TestCase):
    def test_llm_answer_wins_and_disagreement_is_recorded(self):
        answer = {"authorizes_deletion": False, "request_type": "ACCESS", "language": "en", "rationale": "copy only"}
        out = intent.IntentClassifier(FakeLLM(answer)).classify("Can I delete... no, just send me my data.")
        self.assertFalse(out["authorizes_deletion"])
        self.assertEqual(out["source"], "llm")
        self.assertIn("keyword_disagreement", out)

    def test_failed_call_falls_back_to_keywords(self):
        out = intent.IntentClassifier(FakeLLM(None)).classify("Please erase my profile.")
        self.assertTrue(out["authorizes_deletion"])
        self.assertEqual(out["source"], "keywords")


class CacheTest(unittest.TestCase):
    def test_cache_mode_replays_stored_answers_and_never_calls_the_api(self):
        with tempfile.TemporaryDirectory() as tmp:
            llm = LLM(model="claude-haiku-5-5", mode="cache", cache_dir=tmp)
            self.assertFalse(llm.live)
            content = [{"type": "text", "text": "Request text:\nPlease delete my account."}]
            self.assertIsNone(llm.json_call("intent", intent.SYSTEM, content, intent.SCHEMA, 400))
            key = llm._key(intent.SYSTEM, content, intent.SCHEMA, 400)
            os.makedirs(os.path.join(tmp, key[:2]))
            with open(os.path.join(tmp, key[:2], key + ".json"), "w", encoding="utf-8") as fh:
                json.dump({"model": "claude-haiku-5-5", "usage": {"input_tokens": 700, "output_tokens": 80},
                           "output": {"authorizes_deletion": True}}, fh)
            self.assertEqual(llm.json_call("intent", intent.SYSTEM, content, intent.SCHEMA, 400),
                             {"authorizes_deletion": True})
            total = llm.tracker.summary()["total"]
            self.assertEqual((total["cached_calls"], total["live_calls"], total["live_cost_usd"]), (1, 0, 0.0))
            self.assertGreater(total["cost_usd"], 0)

    def test_thinking_is_omitted_only_on_models_that_cannot_disable_it(self):
        sent = {}

        class Response:
            stop_reason = "end_turn"
            usage = type("Usage", (), {"input_tokens": 10, "output_tokens": 5})()
            content = [type("Block", (), {"type": "text", "text": '{"ok": true}'})()]

        class Messages:
            def create(self, **params):
                sent[params["model"]] = params
                return Response()

        with tempfile.TemporaryDirectory() as tmp:
            for model in ("claude-haiku-5-5", "claude-opus-5-5"):
                llm = LLM(model=model, mode="cache", cache_dir=tmp)
                llm.client = type("Client", (), {"messages": Messages()})()
                self.assertEqual(llm.json_call("intent", "s", [{"type": "text", "text": "x"}], {}, 400), {"ok": True})
        self.assertEqual(sent["claude-haiku-5-5"]["thinking"], {"type": "disabled"})
        self.assertEqual(sent["claude-haiku-5-5"]["max_tokens"], 400)
        self.assertNotIn("thinking", sent["claude-opus-5-5"])
        self.assertGreater(sent["claude-opus-5-5"]["max_tokens"], 400)
        self.assertEqual(sent["claude-opus-5-5"]["output_config"]["effort"], "low")

    def test_cache_key_depends_on_the_prompt(self):
        llm = LLM(model="claude-haiku-5-5", mode="cache", cache_dir="unused")
        content = [{"type": "text", "text": "x"}]
        self.assertNotEqual(llm._key("a", content, {}, 10), llm._key("b", content, {}, 10))


if __name__ == "__main__":
    unittest.main()
