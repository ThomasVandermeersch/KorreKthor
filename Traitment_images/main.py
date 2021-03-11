import glob
import json

from process_pdf import extractTextAndImg
import make_pdf
import process_img

# pdf = make_pdf.makePdf('result', 'scan')

def compute(pdf):
    jsonToSend = []

    if pdf == None :
        jsonToSend.append({"error" : "No scanned QCM"})
    else :
        ImgDone = extractTextAndImg(pdf)

        if ImgDone == None :
            jsonToSend.append({"error" : "No existing PDF"})

        else :
            print("\nGetting answers...")
            listPages = glob.glob('From_PDF/*.png')

            if len(listPages) == 0 :
                jsonToSend.append({"error" : "No exported image from PDF"})
            else :
                for img in listPages :

                    answers = process_img.process(img)

                    if answers == None:
                        jsonToSend.append({"error" : f"{img} is not a QCM file"})
                    elif answers == False :
                        jsonToSend.append({"error" : f"{img}, no answers scanned"})
                    else :
                        qrcode = process_img.decodeQRCode(img)

                        if qrcode == None:
                            jsonToSend.append({"error" : f"{img} has no Enable QR Code"})
                        
                        jsonToSend.append({"qrcode":qrcode, "answers":answers, "file":img, "error" : "None"})


    print(json.dumps(jsonToSend))
    print("\nTranslation done!\n")
    return json.dumps(jsonToSend)
