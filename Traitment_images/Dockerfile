FROM python:3.9
WORKDIR /usr/src/korrekthor_img_processing/
RUN apt-get update && apt-get upgrade -y
RUN apt-get install ffmpeg libsm6 libxext6 libzbar0 -y
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
ARG PYTHON_SERVER_PORT
EXPOSE $PYTHON_SERVER_PORT
ENV PYTHON_SERVER_PORT=$PYTHON_SERVER_PORT
CMD [ "python", "./server.py" ]