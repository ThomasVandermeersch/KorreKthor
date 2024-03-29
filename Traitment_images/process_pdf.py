import fitz
from pathlib import Path

# import os
# from process_img import decodeQRCode


def extractTextAndImg(path):
    """
    Extract each page of the pdf provided by path param to a .png file.
    """

    Path("From_PDF/").mkdir(parents=True, exist_ok=True)

    file = fitz.open(path)

    print(f"Nbr of pages: {file.page_count}")
    if file.page_count == 0:
        return None

    fileList = []
    for pageNumber, page in enumerate(file.pages(), start=1):
        fromPath = "From_PDF/" + str(pageNumber) + ".png"
        print(f"Extracting: {fromPath}")

        pix = page.get_pixmap(matrix=fitz.Matrix(2, 2))
        pix.save(fromPath)

        fileList.append(fromPath)

        # why is this done  twice, and why not returning the list ?

        # Rename the file with the student infos
        # student = decodeQRCode(fromPath)
        # if student and "version" in student and "matricule" in student and "lessonId" in student:
        # toPath = f"From_PDF/{student['lessonId']}_{student['version']}_{student['matricule']}.png"
        # os.rename(fromPath, toPath)

    return fileList
