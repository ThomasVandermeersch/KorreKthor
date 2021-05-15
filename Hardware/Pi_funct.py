from time import sleep
import RPi.GPIO as GPIO
import re
## Camera
from picamera import PiCamera
from pyzbar.pyzbar import decode, ZBarSymbol
from PIL import Image
import os
import cv2
import json
import requests

##process_img
import numpy as np
import glob
import matplotlib.pyplot as plt
import math
from pyzbar.pyzbar import decode
##make_pdf
from fpdf import FPDF
from PIL import Image


#########################################
############### ROBOT ARM ###############
#########################################

lesson = ""

####################################
############### INIT ###############
####################################
GPIO.setmode(GPIO.BCM)

###### ARM ######
servoPIN = 27
GPIO.setup(servoPIN, GPIO.OUT)

arm = GPIO.PWM(servoPIN, 50)# GPIO 27 for PWM with 50Hz

arm.start(5) # Initialization
sleep(1)

###### BASE ######
servo2PIN = 17
GPIO.setup(servo2PIN, GPIO.OUT)

base = GPIO.PWM(servo2PIN, 50) # GPIO 17 for PWM with 50Hz
base.start(2.5) # Initialization

###### VALVE ######
valvePIN = 22
GPIO.setup(valvePIN, GPIO.OUT)



####################################
############## ANGLES ##############
####################################
#(angle/18)+2
#maximal angles : U2 - D5 & L11 - C7 - R3
up = 5
down = 9

left = 12
center = 6.5
right = 1



camera = PiCamera()




####################################
############# Movement #############
####################################
def bLeft():
    i = center
    while i < left:
        base.ChangeDutyCycle(i)
        print(i)
        sleep(.1)
        i += 0.1
    sleep(2)
    print("left")
def bCenter():
    base.ChangeDutyCycle(center)
    sleep(2)
def bRight():
    i = center
    while i > right:
        base.ChangeDutyCycle(i)
        print(i)
        sleep(.1)
        i -= 0.1
    sleep(2)
    print("right")

def aDown():
    arm.ChangeDutyCycle(down)
    sleep(4)
    
def  aRest():
    arm.ChangeDutyCycle(up)
    sleep(1)
    base.ChangeDutyCycle(left)
    sleep(1)
    arm.ChangeDutyCycle(down)
def aUp():
    i = down
    while i > up:
        arm.ChangeDutyCycle(i)
        print(i)
        sleep(.1)
        i -= 0.1
    sleep(2)


def valveON():
    GPIO.output(valvePIN, 1)
    sleep(3)

def valveOFF():
    GPIO.output(valvePIN, 0)
    sleep(3)


##########################################
############### Pi CAMERA  ###############
##########################################

# camera = PiCamera()

# def takePic(numb):
#     camera.start_preview()
#     sleep(1)
#     for i in range(numb):
#         camera.capture('/home/pi/Desktop/img/image%s.jpg' %i)
#     sleep(1)
#     camera.stop_preview()


def takePic():

    camera.start_preview()
    camera.capture('/home/pi/Desktop/img/image.PNG')
    img = cv2.imread('/home/pi/Desktop/img/image.PNG')
    img = cv2.rotate(img, cv2.ROTATE_90_COUNTERCLOCKWISE)
    
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    X = 130
    W = 750
    Y = 70
    H = 565

#   img = img[X : X+W, Y : Y+H]
#   img = img[Y: Y+H, X : X+W]
    img = cv2.resize(img, (2425,3500))
    
    
    cv2.imwrite('/home/pi/Desktop/img/image.PNG', img)

    camera.stop_preview()

def uploadPic():



    img = cv2.imread('/home/pi/Desktop/img/image.PNG')
    if(decode(img)):
        print(decode(img))
        print(type(decode(img)[0].data)) 
        if(str(decode(img)[0].data) == "b'STOP'") :
            imgList = glob.glob('/home/pi/Desktop/img/*_*.png')
            first_split = imgList[0].split('/')
            lessonId = first_split[-1].split('_')[0]
            makePdf(lessonId, '/home/pi/Desktop/img/')
            return "finished"
        else :
            barcodes = json.loads(decode(img)[0].data)
            print("----------", barcodes)
            print("done")

            cv2.imwrite(f'/home/pi/Desktop/img/{barcodes["lessonId"]}_{barcodes["version"]}_{barcodes["matricule"]}.png', img)


            

            return "done"
    else :
        return  "done"

        
    # 
#     print("sending file", f'/home/pi/Desktop/img/{barcodes["lesson"]}.pdf')
#     r = requests.post("https://95.182.241.187:9898/create/blabla", files={"file":open(f'/home/pi/Desktop/img/{barcodes["lesson"]}.pdf', "rb")}, verify = False)
#     print(r)









##########################################
############ process_img.py  #############
##########################################




def process(imgPath):
    """
    This function takes an image path and return the equivalent answers boolean array is the image is conform else None. 
    The image is conform if there are 3 squares on each bottom left, top left and top right corners.
    """
    img_rgb = cv2.imread(imgPath)
    img = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)
    img[img >= 170 ] = 255
    img[img < 170 ] = 0
    
    print(img)
    # img = cv2.resize(img, (710, 1024), interpolation=cv2.INTER_LINEAR)

    # img[img>190] = 255
    # cv2.imshow("img", img)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

    goodPage = isGoodPage(img)

    if goodPage:
        if not getGoodOrientation(img, goodPage):
            print("Make a rotation of 180 degrees...")
            img = cv2.rotate(img, cv2.ROTATE_180)
    
        return getImageResponses(img)

    else: 
        return None


def isGoodPage(img, squaresTemplatePath="/home/pi/Desktop/KorreKthor/Traitment_images/source_pdf/squares.PNG", threshold=0.8):
    """
    This function checks is the povided image can be analysed (this means it has 3 templates: TL, TR, BL). 
    If yes returns the squares points list else None. 
    - The img is the image you want to check
    - The squaresTemplatePath param is the locaiton to the squares template
    - The threshold param is the resemblance ratio between the squares template and a block in the image
    """
    img_rgb = cv2.imread(img)
    img = cv2.cvtColor(img_rgb, cv2.COLOR_BGR2GRAY)

    #img[img >= 100 ] = 255
    #img[img < 100 ] = 0
    
    template = cv2.imread(squaresTemplatePath, 0)
    template = cv2.resize(template, (150, 150), interpolation=cv2.INTER_LINEAR)

    # cv2.imshow("img", template)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

    res = cv2.matchTemplate(img, template, cv2.TM_CCOEFF_NORMED)
    loc = np.where(res >= threshold)

    w, h = template.shape[::-1]
    minDistance = math.sqrt(w**2 + h**2)

    # This loop returns a list with 3 points that matches the squares
    points = []
    prev = (0,0)
    for pt in zip(*loc[::-1]):
        #cv2.rectangle(img, pt, (pt[0] + w, pt[1] + h), (0,255,0), 5)
        distance = math.sqrt(((pt[0]-prev[0])**2)+((pt[1]-prev[1])**2))

        if distance > minDistance : 
            points.append(pt)

        prev = pt
    
    if(len(points) >= 3 ):
        print(points)
        print(points[0])
        
        bl = max(points, key=lambda x: x[1])
        tr = max(points, key=lambda x: x[0])
        print("bl: ", bl)
        print("tr: ", tr)
        
        img = img[tr[1]-20:bl[1]+170, bl[0]-20:tr[0]+170]
        
        ratio  = 1.38
        #img = cv2.resize(img, (1191, round(img.shape[0]/ratio)), interpolation=cv2.INTER_LINEAR)
        
        print("Saving the 2nd images")
        cv2.imwrite(f'/home/pi/Desktop/img/image.PNG', img)
        
        return points

    return False

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

    # cv2.imshow("img", emptyTemplate)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

    fullTemplate = cv2.imread(fullTemplatePath, 0)
    fullTemplate = cv2.resize(fullTemplate, (150,150), interpolation=cv2.INTER_LINEAR)

    # cv2.imshow("img", fullTemplate)
    # cv2.waitKey(delay=5000)
    # cv2.destroyAllWindows()

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
    
def decodeQRCode(imagePath):
    preQRCode = decode(cv2.imread(imagePath))

    if len(preQRCode) == 0:
        return None
    
    try:
        qrcode = json.loads(preQRCode[0].data)
    except:
        return None

    if qrcode :
        return qrcode
    else :
        return None
    
    
    
    
def makePdf(pdfFileName, dir=''):
    """
    This function create a PDF with all the .JPG files in the specified directory.
    """

    listPages = glob.glob(dir + '/*.png')

    if len(listPages) != 0 :
        cover = Image.open(str(listPages[0]))
        width, height = cover.size

        pdf = FPDF(orientation = "L", unit = "pt", format = [height, width])

        for page in listPages:
            pdf.add_page()
            pdf.image(page, 0, 0)

        pdf.output(dir + pdfFileName + ".pdf", "F")
        return True 
    else :
        return None
    
    