import numpy as np
import cv2
import glob
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import process_pdf
import math


def process(imgPath):
    """
    This function takes an image path and return the equivalent answers boolean array is the image is conform else None. 
    The image is conform if there are 3 squares on each bottom left, top left and top right corners.
    """
    img_rgb = cv2.imread(imgPath)
    img = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)

    goodPage = isGoodPage(img)

    if goodPage:
        if not getGoodOrientation(img, goodPage):
            print("Make a rotation of 180 degrees...")
            img = cv2.rotate(img, cv2.ROTATE_180)
    
        return getImageResponses(img)

    else: 
        print("Not a QCM file")
        return None


def isGoodPage(img, squaresTemplatePath="result_pdf/squares.PNG", threshold=0.9):
    """
    This function checks is the povided image can be analysed (this means it has 3 templates: TL, TR, BL). 
    If yes returns the squares points list else None. 
    - The img is the image you want to check
    - The squaresTemplatePath param is the locaiton to the squares template
    - The threshold param is the resemblance ratio between the squares template and a block in the image
    """
    template = cv2.imread(squaresTemplatePath, 0)
    template = cv2.resize(template, (210,210), interpolation=cv2.INTER_LINEAR)

    res = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
    loc = np.where(res >= threshold)

    w, h = template.shape[::-1]
    minDistance = math.sqrt(w**2 + h**2)

    # This loop returns a list with 3 points that matches the squares
    points = []
    prev = (0,0)
    for pt in zip(*loc[::-1]):
        distance = math.sqrt(((pt[0]-prev[0])**2)+((pt[1]-prev[1])**2))

        if distance > minDistance : 
            points.append(pt)

        prev = pt
    
    if(len(points) > 0 ) :
        return points

    return None

def getGoodOrientation(img, squaresLocations, margin=0.8):
    """
    Function that returns True if the image is vertial else False.
    - The img param is the image to get the orientation
    - The squaresLocations param is the locations of the squares
    - The margin param is the limit ratio for the squares positions on bottom right
    """
    h, w = img.shape[::-1]
    for point in squaresLocations:
        if point[0] > h*margin and point[1] > w*margin:
            return False

    return True

def getImageResponses(img, fullTemplatePath="result_pdf/rempli.PNG", fullThreshold=0.8, emptyTemplatePath="result_pdf/vide.PNG", emptyThreshold=0.8):
    """
    Function that returns a boolean list of selected response in the provided image. True is selected else False.
    - The img param is the image you want to get the answers
    - The fullTemplatePath param is the fuff template source path
    - The fullThreshold param is the resemblance ratio between the full template and a block in the image
    - The emptyTemplatePath param is the empty template source path
    - The emptyThreshold param is the resemblance ratio between the empty template and a block in the image
    """
    
    emptyTemplate = cv2.imread(emptyTemplatePath, 0)
    emptyTemplate = cv2.resize(emptyTemplate, (100,100), interpolation=cv2.INTER_LINEAR)

    fullTemplate = cv2.imread(fullTemplatePath, 0)
    fullTemplate = cv2.resize(fullTemplate, (150,150), interpolation=cv2.INTER_LINEAR)

    emptyListe = getPatternList(img, emptyTemplate, emptyThreshold, 50)
    fullListe = getPatternList(img, fullTemplate, fullThreshold, 70)

    boolArray = getBoolArray(emptyListe, fullListe, 50)
    return boolArray

def getPatternList(img, template, threshold, minDistance):
    """
    This function returns a list where the templates are detected in pixels.
    - The thresold param is the resemblance ratio
    - The minDistance param is the minimal distance between 2 "same" point 
    """
    result = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
    location = np.where(result >= threshold)

    liste = []

    for pt in zip(*location[::-1]):
        if len(liste) == 0:
            liste.append(pt)

        if pt not in liste:
            same = 0

            for i in liste:
                xdiff = abs(i[0] - pt[0])
                ydiff = abs(i[1] - pt[1])

                # If the pt is near a point in the all liste -> don't add the point 
                if (xdiff < minDistance) and (ydiff < minDistance):
                    same += 1

            if same == 0:
                liste.append(pt)

    return liste

def getBoolArray(emptyListe, fullListe, minDistance):
    """
    This function returns the boolean list with True where there is a full circle else False.
    - The emptyListe param is a list with empty cicle coordinates
    - The fullListe param is a list with full cicle coordinates
    - The minDistance param is the minimal distance between 2 same point

    This function returns None if th emptyListe and fullListe are empty.
    """
    if len(emptyListe) == 0 and len(fullListe) == 0:
        return None

    xEmptyListe, yEmptyListe = zip(*emptyListe) if len(emptyListe) > 0 else []
    xFullListe, yFullListe = zip(*fullListe) if len(fullListe) > 0 else []

    xMin = min(xEmptyListe + xFullListe)
    xMax = max(xEmptyListe + xFullListe)
    yMin = min(yEmptyListe + yFullListe)
    yMax = max(yEmptyListe + yFullListe)

    sortedListe = emptyListe+fullListe
    sortedListe.sort()

    ySortedListe = list(yEmptyListe+yFullListe)
    ySortedListe.sort()

    # This ugly part creates the boolArray liste and fills in with False
    boolArray = []
    y = 0
    c = 0
    for i in ySortedListe:
        if abs(y-i) > minDistance:
            y = i
            sub = []
            if c:
                for i in range(c):
                    sub.append(False)
                boolArray.append(sub)
            c = 0
        c += 1

    sub = []
    for i in range(c):
        sub.append(False)
    boolArray.append(sub)     

    # get the size of the biggest liste in the boolArray
    maxVal = len(max(boolArray, key = lambda i: len(i)))

    for i in sortedListe:
        # x is interpolated between xMin and xMax -> estimation where the point i[0] is on the question line
        x = round(np.interp(i[0], [xMin, xMax], [1, maxVal])) - 1
        # y is interpolated between yMin and yMax -> estimation where the question line is
        y = round(np.interp(i[1], [yMin, yMax], [1, len(boolArray)])) - 1

        if i in fullListe:
            boolArray[y][x] = True
            
    return boolArray
    

    
