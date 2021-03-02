import glob
import json

from process_pdf import extractTextAndImg
import make_pdf
import process_img

pdf = make_pdf.makePdf('result', 'scan')

jsonToSend = []

if pdf == None :
    jsonToSend.append({"error" : "No scanned QCM"})
else :


    ImgDone = extractTextAndImg("scan_result.pdf")

    if ImgDone == None :
        print("No existing pages in de PDF")
        jsonToSend.append({"error" : "No existing PDF"})

    else :

        print("\nGetting answers...")

        listPages = glob.glob('From_PDF/*.png')

        print(listPages)

        if len(listPages) == 0 :
            jsonToSend.append({"error" : "No exported image from PDF"})
        else :
            for img in listPages :
                qrcode = process_img.decodeQRCode(img)

                if qrcode == None:
                    print("No enable QR Code")
                    jsonToSend.append({"error" : "No Enable QR Code"})

                else :
                    answers = process_img.process(img)

                    if answers == None:
                        print("Not a QCM file")
                        jsonToSend.append({"error" : "Not a QCM file"})
                    elif answers == False :
                        jsonToSend.append({"error" : "No answers scanned"})
                    else :
                        jsonToSend.append({"student":qrcode, "answers":answers, "file":img, "error" : "None"})


print(json.dumps(jsonToSend))
print("\nTranslation done!\n")


