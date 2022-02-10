from .. import main
import os

DIR_PATH = os.path.dirname(os.path.realpath(__file__))

class TestMain:
    def test_badPDF(self):
        assert main.compute(f"{DIR_PATH}/files/empty.pdf", "2173ab1a-e409-4a84-b0b7-af389c5a865e") == {'zipFile': '2173ab1a-e409-4a84-b0b7-af389c5a865e.zip', 'data': [{'error': f'{DIR_PATH}/files/empty.pdf is not a PDF file'}]}
    
    def test_wrongExamID(self):
        value = main.compute(f"{DIR_PATH}/files/qcm.pdf", "aaaa")
        assert value["data"][0]["error"] == 'does not belong to the lesson : aaaa'
        assert value["data"][1]["error"] == 'does not belong to the lesson : aaaa'
        assert value["data"][2]["error"] == 'does not belong to the lesson : aaaa'

    def test_goodPDF(self):
        value = main.compute(f"{DIR_PATH}/files/qcm.pdf", "2173ab1a-e409-4a84-b0b7-af389c5a865e")
        assert value["zipFile"] == '2173ab1a-e409-4a84-b0b7-af389c5a865e.zip'
        assert len(value["data"]) == 3
        assert value["data"][0]["answers"] == [[False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False]]
        assert value["data"][1]["answers"] == [[False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False]]
        assert value["data"][2]["answers"] == [[False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False], [False, False, False, False]]