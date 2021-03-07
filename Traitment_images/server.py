from bottle import run, post, request
import main
import os
from pathlib import Path
import time

@post('/run')
def index():
    pdf_file = request.files.get("pdf")
    Path("./saves/").mkdir(parents=True, exist_ok=True)
    
    now = int(time.time())
    file = f"./saves/{now}_{pdf_file.filename}"
    pdf_file.save(file)
    
    return main.compute(file)

run(host='localhost', port=8080)