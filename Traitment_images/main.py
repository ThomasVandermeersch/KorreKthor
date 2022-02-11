from process_pdf import extractTextAndImg
import process_img
import shutil
import pprint

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
            qrcode = process_img.decodeQRCode(img_nb_path)
            if not qrcode or "version" not in qrcode or "matricule" not in qrcode or "lessonId" not in qrcode:
                jsonToSend.append({"error": f"has no correct QR Code: {qrcode}", "filename": img_nb_path})
                continue

            if examId != qrcode["lessonId"]:
                jsonToSend.append(
                    {"error": f"{qrcode} does not belong to the lesson: {examId}", "filename": img_nb_path}
                )
                continue

            answers = process_img.process(img_nb_path)
            if answers == None:
                jsonToSend.append({"error": "is not a QCM file", "filename": img_nb_path})
                continue
            elif answers == False:
                jsonToSend.append({"error": "No answers scanned", "filename": img_nb_path})
                continue

            jsonToSend.append(
                {"qrcode": qrcode, "answers": answers, "file": img_nb_path.split("/")[-1], "error": "None"}
            )
    except Exception as e:
        print("Except:", e)
        # raise
    finally:
        # Zip folder in order to send it
        zipPath = f"zips/{examId}"
        try:
            shutil.make_archive(zipPath, "zip", "From_PDF")
            response = {"zipFile": f"{examId}.zip", "data": jsonToSend}
            print(f"Transaction done, file in : {zipPath}.zip !")
            # print(f"response: {response}")
        except Exception as e:
            print(f"Error while zipping to {zipPath} {e}")
            response = {"error": f"Zipping to {zipPath} failed"}

        # shutil.rmtree("From_PDF/")  # Maybe not do that ?
        return response


if __name__ == "__main__":
    res = compute("tests/82318c24-3f36-424f-9b29-c1e7e05acfe5.pdf", "82318c24-3f36-424f-9b29-c1e7e05acfe5")
    print(res)
    print("----")
    # res = compute("tests/a1ec4c74-f576-477d-9432-ad9a8a629b49_.pdf", "66af46b7-22f2-434e-a3ef-2bf547cab961")
    res = compute("tests/cfc8eaf2-17c8-48c1-9b16-ecb0d6d030f1_.pdf", "66af46b7-22f2-434e-a3ef-2bf547cab961")
    pprint.pprint(res)
