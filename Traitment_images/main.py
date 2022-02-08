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

        listPages = extractTextAndImg(pdfFileLocation)
        if listPages == None:
            jsonToSend.append({"error": f"{pdfFileLocation} is not a PDF file"})
            return

        # print(f"Getting answers... from {pdfFileLocation}")
        # listPages = glob.glob("From_PDF/*.png")
        # if len(listPages) == 0:
        # jsonToSend.append({"error": f"No image in {pdfFileLocation}"})
        # return

        for img_nb_path in listPages:
            answers = process_img.process(img_nb_path)
            if answers == None:
                jsonToSend.append({"error": "is not a QCM file", "filename": img_nb_path})
                continue
            elif answers == False:
                jsonToSend.append({"error": "No answers scanned", "filename": img_nb_path})
                continue

            qrcode = process_img.decodeQRCode(img_nb_path)
            if not qrcode or "version" not in qrcode or "matricule" not in qrcode or "lessonId" not in qrcode:
                jsonToSend.append({"error": f"has no correct QR Code: {qrcode}", "filename": img_nb_path})
                continue

            if examId != qrcode["lessonId"]:
                jsonToSend.append(
                    {"error": f"{qrcode} does not belong to the lesson: {examId}", "filename": img_nb_path}
                )
                continue

            jsonToSend.append(
                {"qrcode": qrcode, "answers": answers, "file": img_nb_path.split("/")[-1], "error": "None"}
            )

    finally:
        # Zip folder in order to send it
        zipPath = f"zips/{examId}"
        try:
            shutil.make_archive(zipPath, "zip", "From_PDF")
            response = {"zipFile": f"{examId}.zip", "data": jsonToSend}
            print(f"Transaction done, file in : {zipPath}.zip !")
            print(f"response: {response}")
        except:
            print(f"Error while zipping to {zipPath}")
            response = {"error": f"Zipping to {zipPath} failed"}

        # shutil.rmtree("From_PDF/")  # Maybe not do that ?
        return response
