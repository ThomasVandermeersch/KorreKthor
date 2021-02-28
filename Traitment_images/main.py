import process_pdf
import make_pdf
import process_img
import glob

make_pdf.makePdf('result', 'scan')
process_pdf.ExtractTextAndImg("scan_result.pdf")

listPages = glob.glob('From_PDF/*.png')


for img in listPages :
    print("\n")
    print("--", img, "--")
    print("QRCode :", process_img.decodeQRCode(img))
    value = process_img.process(img)
    print("Result ->", value)

print("\nTranslation done!\n")


