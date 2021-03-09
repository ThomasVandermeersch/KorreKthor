import fitz
import os

from process_img import decodeQRCode

def extractTextAndImg(path):
    """
    Extract each page of the pdf provided by path param to a .png file.
    """
    file = fitz.open(path)

    print("Nbr of pages:", file.page_count)

    if file.page_count != 0 :
        for pageNumber, page in enumerate(file.pages(), start = 1):
            fromPath = "From_PDF/" + str(pageNumber) + ".png"
            print(" Extracting", fromPath)

            # Save image to From_PDF/
            img = page.getImageList()
            xref = img[pageNumber-1][0]
            pix = fitz.Pixmap(file, xref)
            pix.writePNG(fromPath)

            # Rename the file with the student infos
            student = decodeQRCode(fromPath)
            if student:
                toPath = f"From_PDF/{student['lesson']}_{student['version']}_{student['matricule']}.png"
                os.rename(fromPath, toPath)

        return True
    else :
        return None


