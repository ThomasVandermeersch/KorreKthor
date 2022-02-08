import glob
from process_pdf import extractTextAndImg
import process_img
import shutil

# import json
# import make_pdf


def compute(pdfFileLocation, examId):

    jsonToSend = []
    try:
        if pdfFileLocation == None:
            jsonToSend.append({"error": "No scanned QCM"})
            return  # Note: return in a try..finally statement triggers the finally statement and uses the return from there

        if extractTextAndImg(pdfFileLocation) == None:
            jsonToSend.append({"error": f"{pdfFileLocation} is not a PDF file"})
            return

        print("\nGetting answers...")
        listPages = glob.glob("From_PDF/*.png")
        if len(listPages) == 0:
            jsonToSend.append({"error": f"No image in {pdfFileLocation}"})
            return

        for img in listPages:
            answers = process_img.process(img)
            if answers == None:
                jsonToSend.append({"error": "is not a QCM file", "filename": img})
                continue
            elif answers == False:
                jsonToSend.append({"error": "No answers scanned", "filename": img})
                continue

            qrcode = process_img.decodeQRCode(img)
            if not qrcode or "version" not in qrcode or "matricule" not in qrcode or "lessonId" not in qrcode:
                jsonToSend.append({"error": "has no correct QR Code", "filename": img})
                continue

            if examId != qrcode["lessonId"]:
                jsonToSend.append({"error": f"does not belong to the lesson : {examId}", "filename": img})
                continue

            jsonToSend.append(
                {"qrcode": qrcode, "answers": answers, "file": img.split("/")[-1], "error": "None"}
            )

    finally:
        # Zip folder in order to send it
        zipPath = f"zips/{examId}"
        try:
            shutil.make_archive(zipPath, "zip", "From_PDF")
            response = {"zipFile": f"{examId}.zip", "data": jsonToSend}
            print(f"\nTransaction done, file in : {zipPath}.zip !\n")
            print("response:", response)
        except:
            print(f"Error while zipping to {zipPath}")
            response = {"error": f"Zipping to {zipPath} failed"}

        shutil.rmtree("From_PDF/")
        return response
