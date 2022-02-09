import cv2
from .. import process_img
import os

DIR_PATH = os.path.dirname(os.path.realpath(__file__))

def load_image(path):
    img_rgb = cv2.imread(path)
    img = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)
    ratio  = img.shape[1]/1191
    img = cv2.resize(img, (1191, round(img.shape[0]/ratio)), interpolation=cv2.INTER_LINEAR)
    return img

class TestBoolArray:
    def test_getEmptiesBoolArray(self):
        emptyListe = []
        fullListe = []
        minDistance = 25
        boolArray = process_img.getBoolArray(emptyListe, fullListe, minDistance)
        assert not boolArray

    def test_getBoolOnSameArray(self):
        emptyListe = [(0, 0), (30, 0), (60, 0)]
        fullListe = [(0, 30), (30, 30), (60, 30)]
        minDistance = 25
        boolArray = process_img.getBoolArray(emptyListe, fullListe, minDistance)
        assert boolArray == [[False, False, False], [True, True, True]]
    
    def test_getNormalBoolArray(self):
        emptyListe = [(0, 0), (30, 0), (60, 0)]
        fullListe = [(0, 30), (30, 30), (60, 30), (90, 30)]
        minDistance = 25
        boolArray = process_img.getBoolArray(emptyListe, fullListe, minDistance)
        assert boolArray == [[False, False, False], [True, True, True, True]]

    def test_getProbableBoolArray(self):
        emptyListe = [(0, 0), (0, 60), (0, 90), (30, 90), (60, 90)]
        fullListe = [(0, 30), (30, 30), (60, 30), (90, 30), (90, 90)]
        minDistance = 25
        boolArray = process_img.getBoolArray(emptyListe, fullListe, minDistance)
        assert boolArray == [[False], [True, True, True, True], [False], [False, False, False, True]]
    
    def test_checkVerticalDistance(self):
        emptyListe = [(0, 0)]
        fullListe = [(0, 25)]
        minDistance = 25
        boolArray = process_img.getBoolArray(emptyListe, fullListe, minDistance)
        assert boolArray == [[False, True]]

class TestPatternList:
    def test_getPatternList(self):
        img = load_image(f"{DIR_PATH}/files/responses.png")

        emptyTemplate = cv2.imread(f"{DIR_PATH}/../source_pdf/vide.PNG", 0)
        template = cv2.resize(emptyTemplate, (29, 29), interpolation=cv2.INTER_LINEAR)
        threshold = 0.5
        minDistance = 25

        emptyListe = process_img.getPatternList(img, template, threshold, minDistance)
        assert emptyListe == [(70, 49), (140, 49), (210, 49), (70, 89), (140, 89), (210, 89), (70, 129), (140, 129), (210, 129), (70, 169), (140, 169), (210, 169), (70, 209), (140, 209), (210, 209), (70, 249), (140, 249), (210, 249), (70, 289), (140, 289), (210, 289), (70, 329), (140, 329), (210, 329)]

        fullTemplate = cv2.imread(f"{DIR_PATH}/../source_pdf/rempli.PNG", 0)
        template = cv2.resize(fullTemplate, (35, 35), interpolation=cv2.INTER_LINEAR)
        threshold = 0.6
        minDistance = 35
        fullListe = process_img.getPatternList(img, template, threshold, minDistance)
        assert fullListe == []

class TestImageResponses:
    def test_getImageResponses(self):
        img = load_image(f"{DIR_PATH}/files/responses.png")

        img_response = process_img.getImageResponses(img, f"{DIR_PATH}/../source_pdf/rempli.PNG", 0.6, f"{DIR_PATH}/../source_pdf/vide.PNG", 0.5)
        assert img_response == [[False, False, False], [False, False, False], [False, False, False], [False, False, False], [False, False, False], [False, False, False], [False, False, False], [False, False, False]]

class TestGoodOrientation:
    def test_getGoodOrientation(self):
        img = load_image(f"{DIR_PATH}/files/responses.png")
        squaresLocations = [(1084, 41), (45, 1550), (1084, 1551)]
        assert process_img.getGoodOrientation(img, squaresLocations, margin=0.8)

        squaresLocations = [(1084, 41), (45, 41), (1084, 1551)]
        assert not process_img.getGoodOrientation(img, squaresLocations, margin=0.8)

        img = load_image(f"{DIR_PATH}/files/wrong_orientation.png")
        squaresLocations = [(1084, 41), (45, 1550), (1084, 1551)]
        assert process_img.getGoodOrientation(img, squaresLocations, margin=0.8)

class TestGoodPage:
    def test_isGoodPage(self):
        img = load_image(f"{DIR_PATH}/files/responses.png")
        assert process_img.isGoodPage(img, f"{DIR_PATH}/../source_pdf/squares.PNG", 0.8)

        img = load_image(f"{DIR_PATH}/files/wrong_page.png")
        assert not process_img.isGoodPage(img, f"{DIR_PATH}/../source_pdf/squares.PNG", 0.8)

class TestProcess:
    def test_process(self):
        print(process_img.process(f"{DIR_PATH}/files/responses.png"))