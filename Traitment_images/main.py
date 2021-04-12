import glob
import json

from process_pdf import extractTextAndImg
import make_pdf
import process_img
import shutil

def compute(pdf):
    jsonToSend = []

    if pdf == None :
        jsonToSend.append({"error" : "No scanned QCM"})
    else :
        ImgDone = extractTextAndImg(pdf)

        if ImgDone == None :
            jsonToSend.append({"error" : f"{pdf} is not a PDF file"})

        else :
            print("\nGetting answers...")
            listPages = glob.glob('From_PDF/*.png')

            if len(listPages) == 0 :
                jsonToSend.append({"error" : f"No image in {pdf}"})
            else:

                i = 0
                firstQRCode = None
                while firstQRCode == None:
                    if i > 10:
                        jsonToSend.append({"error" : f"No QRCode available in {pdf}"})
                        break

                    firstQRCode = process_img.decodeQRCode(listPages[i])
                    i+=1

                for img in listPages :
                    answers = process_img.process(img)

                    if answers == None:
                        jsonToSend.append({"error" : f"{img} is not a QCM file"})
                    elif answers == False :
                        jsonToSend.append({"error" : f"No answers scanned in {img}"})
                    else:

                        qrcode = process_img.decodeQRCode(img)

                        if not qrcode or "version" not in qrcode or "matricule" not in qrcode or "lessonId" not in qrcode:
                            jsonToSend.append({"error" : f"{img} has no correct QR Code"})
                            
                        else:
                            if firstQRCode["lessonId"] != qrcode["lessonId"]:
                                jsonToSend.append({"error" : f"{img} does not belong to the lesson : {firstQRCode}"})
                            
                            else:
                                jsonToSend.append({"qrcode":qrcode, "answers":answers, "file":img.split("/")[-1], "error" : "None"})
                        

    # Zip folder in order to send it
    zipPath = f'zips/{firstQRCode["lessonId"]}'
    try:
        shutil.make_archive(zipPath, "zip", "From_PDF")
        response = {"zipFile":f"{firstQRCode['lessonId']}.zip", "data":jsonToSend}
        print(f"\nTransaction done, file in : {zipPath}.zip !\n")
        print("response:", response)
    except:
        print(f"Error while zipping to {zipPath}")
        response = {"error":f"Zipping to {zipPath} failed"}

    shutil.rmtree("From_PDF/")
    return response
