from PyPDF2 import PdfFileReader, PdfFileWriter
import fitz
import numpy as np
from matplotlib import pyplot as plt
import matplotlib.image as mpimg
import os


def ExtractFromPDF(path):
    with open(path, 'rb') as f:
            pdf = PdfFileReader(f)
            information = pdf.getDocumentInfo()
            number_of_pages = pdf.getNumPages()

            txt = information.title
            
            """
            Information about {pdf_path}:

            Author: {information.author}
            Creator: {information.creator}
            Producer: {information.producer}
            Subject: {information.subject}
            Title: {information.title}
            Number of pages: {number_of_pages}
            """

            print(txt)

name_of_split = "test"

def split(path, name_of_split):
    pdf = PdfFileReader(path)
    for page in range(pdf.getNumPages()):
        pdf_writer = PdfFileWriter()
        pdf_writer.addPage(pdf.getPage(page))

        output = name_of_split + str(page) +'.pdf'
        with open(output, 'wb') as output_pdf:
            pdf_writer.write(output_pdf)


def ExtractTextAndImg(path):
    file = fitz.open(path)
    for pageNumber, page in enumerate(file.pages(), start = 1):

        img = page.getImageList()
        print(img[pageNumber-1])

        xref = img[pageNumber-1][0]
        pix = fitz.Pixmap(file, xref)

        pix.writePNG("From_PDF/" + str(pageNumber) + '.png')

        img = mpimg.imread("From_PDF/" + str(pageNumber) + '.png')
        height = img.shape[0]
        width = img.shape[1]

        if height == 1 and width == 1 :
            os.remove("From_PDF/" + str(pageNumber) + '.png')


        # for imgNumber, img in enumerate(page.getImageList(), start = 1):
        #     xref = img[0]
        #     print(xref)
        #     pix = fitz.Pixmap(file, xref)

        # pix.writePNG("examen/" + str(pageNumber) + '.png')

        # img = mpimg.imread("examen/" + str(pageNumber) + '.png')
        # height = img.shape[0]
        # width = img.shape[1]

        # if height == 1 and width == 1 :
        #     os.remove("examen/" + str(pageNumber) + '.png')




# ExtractFromPDF(path)
#split(path,name_of_split)
# ExtractTextAndImg(path)

