from io import BufferedReader
import shutil
from pathlib import Path
import os

from boddle import boddle
from Traitment_images import server 

DIR_PATH = os.path.dirname(os.path.realpath(__file__))

class TestRoutes:
    def test_testRoute(self):
        assert server.resp() == "Hello"

    def test_index(self):
        with boddle():
            assert server.index() == {'error': 'Expected fields : file, exam_id'}
    
    def test_static(self):
        Path(f"{DIR_PATH}/../zips/").mkdir(parents=True, exist_ok=True)
        shutil.copyfile(f"{DIR_PATH}/files/exam.zip", f"{DIR_PATH}/../zips/exam.zip")
        
        with boddle():
            resp = server.send_static("exam.zip")
            assert resp.status_code == 200
            assert type(resp.body) == BufferedReader

        os.remove(f"{DIR_PATH}/../zips/exam.zip")