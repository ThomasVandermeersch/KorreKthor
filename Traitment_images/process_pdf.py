import fitz
import os
from pathlib import Path

from utils import decodeQRCode

DIR_PATH = os.path.dirname(os.path.realpath(__file__))

def extractTextAndImg(path):
    """
    Extract each page of the pdf provided by path param to a .png file.
    """

    Path(f"{DIR_PATH}/From_PDF/").mkdir(parents=True, exist_ok=True)

    try: 
        file = fitz.open(path)
    except:
        return None


    print("Nbr of pages:", file.page_count)

    if file.page_count != 0 :
        for pageNumber, page in enumerate(file.pages(), start = 1):
            fromPath = f"{DIR_PATH}/From_PDF/{pageNumber}.png"
            print(" Extracting", fromPath)

            pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
            pix.save(fromPath)

            # Rename the file with the student infos
            student = decodeQRCode(fromPath)
            if student and "version" in student and "matricule" in student and "lessonId" in student:
                toPath = f"{DIR_PATH}/From_PDF/{student['lessonId']}_{student['version']}_{student['matricule']}.png"
                print(f" Renaming {fromPath} -> {toPath}")
                os.rename(fromPath, toPath)

        return True
    return None


