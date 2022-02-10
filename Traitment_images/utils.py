
import json
import cv2
from pyzbar.pyzbar import decode

def decodeQRCode(imagePath):
    img = cv2.imread(imagePath)
    if img is None:
        return None
        
    img = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    ratio  = img.shape[1]/1191
    img = cv2.resize(img, (1191, round(img.shape[0]/ratio)), interpolation=cv2.INTER_LINEAR)
    preQRCode = decode(img)

    if len(preQRCode) == 0: # One more chance to get the QRCode 
            img = img[0:500, 0:500]
            preQRCode = decode(img)
            
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
