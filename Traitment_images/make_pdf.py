from fpdf import FPDF
from PIL import Image
import glob


def makePdf(pdfFileName, dir=''):
    """
    This function create a PDF with all the .JPG files in the specified directory.
    """

    listPages = glob.glob(dir + '/*.JPG')

    if len(listPages) != 0 :
        print(listPages)

        cover = Image.open(str(listPages[0]))
        width, height = cover.size

        pdf = FPDF(orientation = "L", unit = "pt", format = [height, width])

        for page in listPages:
            pdf.add_page()
            pdf.image(page, 0, 0)

        pdf.output(dir + "_" + pdfFileName + ".pdf", "F")
    else :
        return None




