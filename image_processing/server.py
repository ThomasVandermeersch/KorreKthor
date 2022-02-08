from bottle import run, get, post, request, route, static_file
import main
import os
from pathlib import Path
from datetime import datetime

@get("/")
def resp():
    return "Hello"

@post('/run')
def index():
    examId = request.forms.get("exam_id")
    pdfFile = request.files.get("file")

    if pdfFile and examId:
        Path("./saves/").mkdir(parents=True, exist_ok=True)
        now = datetime.now().strftime("%Y_%m_%d__%H_%M_%S")
        fileLocation = f"./saves/{now}_{pdfFile.filename}"
        pdfFile.save(fileLocation)

        print("Got file in:", fileLocation) 
        computation = main.compute(fileLocation, examId)
        print(computation)
        return computation
    else:
        return {"error":"Expected fields : file, exam_id"}

@route('/static/<filename:path>')
def send_static(filename):
    return static_file(filename, root='./zips')


run(host='0.0.0.0', port=int(os.environ.get("PYTHON_SERVER_PORT")))

