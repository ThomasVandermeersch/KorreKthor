from bottle import run, get, post, request, BaseRequest, route, static_file
import main
import os
from pathlib import Path
from datetime import datetime

# from fdsend import send_file
# import io
# import sys


@get("/")
def resp():
    return "Hello"


@post("/run")
def index():
    examId = request.forms.get("exam_id")
    gridLayout = request.forms.get("gridLayouts")
    pdfFile = request.files.get("file")

    if pdfFile and examId:
        Path("./saves/").mkdir(parents=True, exist_ok=True)
        now = datetime.now().strftime("%Y_%m_%d__%H_%M_%S")
        fileLocation = f"./saves/{now}_{pdfFile.filename}"
        pdfFile.save(fileLocation)

        print(f"Got file in: {fileLocation}")
        computation = main.compute(fileLocation, examId, gridLayout)
        print(computation)
        return computation
    else:
        return {"error": "Expected fields : file, exam_id"}


@route("/static/<filename:path>")
def send_static(filename):
    return static_file(filename, root="./zips")


# print(main.compute("./saves/out.pdf"))
run(host="0.0.0.0", port=int(os.environ.get("PYTHON_SERVER_PORT")))
