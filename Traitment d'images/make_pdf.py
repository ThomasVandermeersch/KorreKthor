from fpdf import FPDF
import PyPDF2
from PIL import Image
import glob


def makePdf(pdfFileName, dir = ''):

    listPages = glob.glob(dir + '/*.JPG')

    print(listPages)

    cover = Image.open(str(listPages[0]))
    width, height = cover.size

    pdf = FPDF(orientation = "L", unit = "pt", format = [height, width])

    for page in listPages:
        pdf.add_page()
        pdf.image(page, 0, 0)

    pdf.output(dir + "_" + pdfFileName + ".pdf", "F")




