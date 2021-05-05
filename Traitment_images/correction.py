import cv2 as cv
import numpy as np
from matplotlib import pyplot as plt
import fitz

# TODO: get correction from webserver
correct = [[True, False, False, False], [False, True, False, False], [False, False, True, False], [False, False, False, True]]
np_correct = np.array(correct)


img_rgb = cv.imread('From_PDF/3.png')
img_gray = cv.cvtColor(img_rgb, cv.COLOR_BGR2GRAY)
template = cv.imread('source_pdf/vide.PNG',0)
template = cv.resize(template, (100,100), interpolation=cv.INTER_LINEAR)


w, h = template.shape[::-1]
res = cv.matchTemplate(img_gray,template,cv.TM_CCOEFF_NORMED)
threshold = 0.80
loc = np.where( res >= threshold)


for pt in zip(*loc[::-1]):
    print(pt)
    cv.rectangle(img_rgb, pt, (pt[0] + w, pt[1] + h), (0,0,255), 5)
cv.imwrite('correction.png',img_rgb)


template = cv.imread('source_pdf/rempli.PNG',0)
template = cv.resize(template, (150,150), interpolation=cv.INTER_LINEAR)

w, h = template.shape[::-1]
res = cv.matchTemplate(img_gray,template,cv.TM_CCOEFF_NORMED)
threshold = 0.80
loc = np.where( res >= threshold)

if loc :
    for pt in zip(*loc[::-1]):
        cv.rectangle(img_rgb, pt, (pt[0] + w, pt[1] + h), (0,255,0), 5)
        cv.imwrite('correction.png',img_rgb)
else :
    return None

