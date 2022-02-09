from image_processing import process_pdf
import os
from os import listdir

DIR_PATH = os.path.dirname(os.path.realpath(__file__))

class TestClass:
    def test_extractEmptyPDF(self):
        path = f"{DIR_PATH}/files/empty.pdf"
        assert not process_pdf.extractTextAndImg(path)

    def test_extractTextAndImg(self):
        path = f"{DIR_PATH}/files/qcm.pdf"
        assert process_pdf.extractTextAndImg(path)

        files = listdir(f"{DIR_PATH}/../From_PDF/")
        assert "2173ab1a-e409-4a84-b0b7-af389c5a865e_B_17076.png" in files
        assert "2173ab1a-e409-4a84-b0b7-af389c5a865e_A_17036.png" in files
        assert "2173ab1a-e409-4a84-b0b7-af389c5a865e_A_19371.png" in files

