from bottle import run, get, post, request, BaseRequest, route, static_file
import main
import os
from pathlib import Path
from datetime import datetime
from fdsend import send_file
import io

@get("/")
def resp():
    return "Hello"

@post('/run')
def index():
    pdf_file = request.files.get("my_file")
    Path("./saves/").mkdir(parents=True, exist_ok=True)
    
    now = datetime.now().strftime("%Y_%m_%d__%H_%M_%S")
    file = f"./saves/{now}_{pdf_file.filename}"
    pdf_file.save(file)
    print("Got file in:", file) 

    return main.compute(file)

@route('/static/<filename:path>')
def send_static(filename):
    return static_file(filename, root='./zips')

run(host='0.0.0.0', port=8080)

