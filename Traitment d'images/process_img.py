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
        if corners == True :
            print("A l'endroit")

        else :
            print("Make rotation of 180 degrees")



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
