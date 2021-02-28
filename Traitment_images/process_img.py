import numpy as np
import cv2
import glob
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
import process_pdf
import math


def process(img):
    goodPage = isGoodPage(img)

    if goodPage :
        corners = getCorners(img, goodPage)
        img_rgb = cv2.imread(img)
        img = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)

        if corners == True :
            print("A l'endroit")

        else :
            print("Make rotation of 180 degrees")
            img = cv2.rotate(img, cv2.ROTATE_180)
    
        # TODO: Call correction
        return getImageResponses(img)

    else : 
        print("Not a QCM file")
        print(img)


def isGoodPage(img) :
    img_rgb = cv2.imread(img)
    img_gray = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)
    template = cv2.imread('result_pdf/squares.PNG',0)
    template = cv2.resize(template, (210,210), interpolation=cv2.INTER_LINEAR)
    w, h = template.shape[::-1]
    # print(w,h)
    res = cv2.matchTemplate(img_gray,template,cv2.TM_CCOEFF_NORMED)
    threshold = 0.90
    loc = np.where( res >= threshold)
    
    # print(loc[::-1])

    prev = (0,0)

    TRESHOLD = math.sqrt(w**2 + h**2)

    points = []

    for pt in zip(*loc[::-1]):
    # pt = (93,3020)
    # cv2.rectangle(img_rgb, pt, (pt[0] + w, pt[1] + h), (0,0,255), 2)
        distance = math.sqrt( ((pt[0]-prev[0])**2)+((pt[1]-prev[1])**2))

        if distance > TRESHOLD : 
            cv2.circle(img_rgb, pt, 5, (0,0,255), 2)
            points.append(pt)

        prev = pt
    cv2.imwrite('res.png',img_rgb)
    
    if(len(points) > 0 ) :
        return points

    return False

def getCorners(img, loc):

    # for i in loc :
    #     print(i)


    #TODO adapt constant with size of page

    # print(loc)

    for point in loc :
        if point[0] > (2000) and point[1] > (2800) :
            print(img)
            return False

    
    return True

def getImageResponses(img, fullPattern="result_pdf/rempli.PNG", fullThreshold=0.8, emptyPattern="result_pdf/vide.PNG", emptyThreshold=0.8):
    """
    Function that returns the list of selected response in the provided image.
    """
    
    emptyTemplate = cv2.imread(emptyPattern, 0)
    emptyTemplate = cv2.resize(emptyTemplate, (100,100), interpolation=cv2.INTER_LINEAR)

    fullTemplate = cv2.imread(fullPattern, 0)
    fullTemplate = cv2.resize(fullTemplate, (150,150), interpolation=cv2.INTER_LINEAR)

    emptyListe = getPatternList(img, emptyTemplate, emptyThreshold, 50)
    fullListe = getPatternList(img, fullTemplate, fullThreshold, 70)

    boolArray = getBoolArray(emptyListe, fullListe, 50, 100)
    return boolArray

def getPatternList(img, pattern, threshold, minDistance):
    result = cv2.matchTemplate(img, pattern, cv2.TM_CCOEFF_NORMED)
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

def getBoolArray(emptyListe, fullListe, minDistance, jumpDistance):
    xEmptyListe, yEmptyListe = zip(*emptyListe)
    xFullListe, yFullListe = zip(*fullListe)

    xMin = min(xEmptyListe + xFullListe)
    xMax = max(xEmptyListe + xFullListe)
    yMin = min(yEmptyListe + yFullListe)
    yMax = max(yEmptyListe + yFullListe)

    sortedListe = emptyListe+fullListe
    sortedListe.sort()

    ySortedListe = list(yEmptyListe+yFullListe)
    ySortedListe.sort()

    xSortedListe2 = list(xEmptyListe+xFullListe)
    xSortedListe2.sort()

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

    maxVal = 0
    for i in boolArray:
        if len(i) > maxVal:
            maxVal = len(i)

    for i in sortedListe:
        x = round(np.interp(i[0], [xMin, xMax], [1, maxVal])) - 1
        y = round(np.interp(i[1], [yMin, yMax], [1, len(boolArray)])) - 1

        if i in fullListe:
            boolArray[y][x] = True
            
    return boolArray
    

    
