from image_processing import utils
import os

DIR_PATH = os.path.dirname(os.path.realpath(__file__))

class TestClass:
    def test_decodeEmptyQRCode(self):
        path = f"{DIR_PATH}/files/empty.png"
        assert not utils.decodeQRCode(path)
        
    def test_decodeNoQRCode(self):
        path = f"{DIR_PATH}/files/noqrcode.png"
        assert not utils.decodeQRCode(path)

    def test_decodeQRCode(self):
        path = f"{DIR_PATH}/files/qrcode.png"
        qrcode =  utils.decodeQRCode(path)
        assert type(qrcode) is dict
        assert qrcode.get("lessonId")
        assert qrcode.get("matricule")
        assert qrcode.get("version")



