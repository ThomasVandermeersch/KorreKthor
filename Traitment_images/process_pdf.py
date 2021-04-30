import fitz
import os
from pathlib import Path

from process_img import decodeQRCode

def extractTextAndImg(path):
    """
    Extract each page of the pdf provided by path param to a .png file.
    """

    Path("From_PDF/").mkdir(parents=True, exist_ok=True)

    file = fitz.open(path)

    print("Nbr of pages:", file.page_count)

    if file.page_count != 0 :
        for pageNumber, page in enumerate(file.pages(), start = 1):
            fromPath = "From_PDF/" + str(pageNumber) + ".png"
            print(" Extracting", fromPath)

            # Save image to From_PDF/
            img = page.getImageList()
            xref = img[pageNumber-1][0]
            # xref = img[0][0]
            pix = fitz.Pixmap(file, xref)
            pix.writePNG(fromPath)

            # Rename the file with the student infos
            student = decodeQRCode(fromPath)
            if student and "version" in student and "matricule" in student and "lessonId" in student:
                # toPath = f"From_PDF/{student['version']}_{student['matricule']}.png"
                toPath = f"From_PDF/{student['lessonId']}_{student['version']}_{student['matricule']}.png"
                os.rename(fromPath, toPath)

        return True
    else :
        return None


