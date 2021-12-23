import glob
import json

from process_pdf import extractTextAndImg
import make_pdf
import process_img
import shutil

def compute(pdfFileLocation, examId):
    jsonToSend = []

    if pdfFileLocation == None :
        jsonToSend.append({"error" : "No scanned QCM"})
    else :
        ImgDone = extractTextAndImg(pdfFileLocation)

        if ImgDone == None :
            jsonToSend.append({"error" : f"{pdfFileLocation} is not a PDF file"})

        else :
            print("\nGetting answers...")
            listPages = glob.glob('From_PDF/*.png')

            if len(listPages) == 0 :
                jsonToSend.append({"error" : f"No image in {pdfFileLocation}"})
            else:
                for img in listPages :
                    answers = process_img.process(img)

                    if answers == None:
                        jsonToSend.append({"error" : f"{img} is not a QCM file", "filename":img})
                    elif answers == False :
                        jsonToSend.append({"error" : f"No answers scanned in {img}", "filename":img})
                    else:

                        qrcode = process_img.decodeQRCode(img)

                        if not qrcode or "version" not in qrcode or "matricule" not in qrcode or "lessonId" not in qrcode:
                            jsonToSend.append({"error" : f"{img} has no correct QR Code", "filename":img})
                            
                        else:
                            if examId != qrcode["lessonId"]:
                                jsonToSend.append({"error" : f"{img} does not belong to the lesson : {examId}"})
                            
                            else:
                                jsonToSend.append({"qrcode":qrcode, "answers":answers, "file":img.split("/")[-1], "error" : "None"})
                        

    # Zip folder in order to send it
    zipPath = f'zips/{examId}'
    try:
        shutil.make_archive(zipPath, "zip", "From_PDF")
        response = {"zipFile":f"{examId}.zip", "data":jsonToSend}
        print(f"\nTransaction done, file in : {zipPath}.zip !\n")
        print("response:", response)
    except:
        print(f"Error while zipping to {zipPath}")
        response = {"error":f"Zipping to {zipPath} failed"}

    shutil.rmtree("From_PDF/")
    return response
