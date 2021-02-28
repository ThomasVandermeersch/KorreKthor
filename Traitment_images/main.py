import glob
import json

from process_pdf import extractTextAndImg
import make_pdf
import process_img

make_pdf.makePdf('result', 'scan')
extractTextAndImg("scan_result.pdf")

print("\nGetting answers...")

listPages = glob.glob('From_PDF/*.png')

jsonToSend = []
for img in listPages :
    qrcode = process_img.decodeQRCode(img)
    answers = process_img.process(img)
    jsonToSend.append({"student":qrcode, "answers":answers, "file":img})


print(json.dumps(jsonToSend))
print("\nTranslation done!\n")


